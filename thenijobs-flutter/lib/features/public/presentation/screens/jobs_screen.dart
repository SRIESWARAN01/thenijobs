// ============================================================
// THENIJOBS — Jobs Directory Screen
// ============================================================

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({
    super.key,
    this.initialSearch,
    this.initialLocation,
    this.initialCategory,
  });

  final String? initialSearch;
  final String? initialLocation;
  final String? initialCategory;

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedLocation = ''; // All Areas
  final List<String> _selectedTypes = [];
  final List<String> _selectedCategories = [];
  String _sortBy = 'latest'; // latest, salary, relevance
  bool _showFilters = false;

  final List<String> _jobTypesList = const [
    'Full Time',
    'Part Time',
    'Remote',
    'WFH',
    'Internship',
    'Fresher',
    'Contract'
  ];

  final List<String> _categoriesList = const [
    'Agriculture',
    'Education',
    'IT & Software',
    'Healthcare',
    'Construction',
    'Textiles',
    'Transport',
    'Finance'
  ];

  @override
  void initState() {
    super.initState();
    final initialSearch = widget.initialSearch?.trim() ?? '';
    final initialLocation = widget.initialLocation?.trim() ?? '';
    final initialCategory = widget.initialCategory?.trim() ?? '';
    if (initialSearch.isNotEmpty) {
      _searchController.text = initialSearch;
      _searchQuery = initialSearch;
    }
    if (initialLocation.isNotEmpty) {
      _selectedLocation = initialLocation;
    }
    if (initialCategory.isNotEmpty && _categoriesList.any((item) => item.toLowerCase() == initialCategory.toLowerCase())) {
      _selectedCategories.add(_categoriesList.firstWhere((item) => item.toLowerCase() == initialCategory.toLowerCase()));
    }
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'Recently';
    final difference = DateTime.now().difference(dateTime);
    if (difference.inDays >= 1) return '${difference.inDays} d ago';
    if (difference.inHours >= 1) return '${difference.inHours} hr ago';
    if (difference.inMinutes >= 1) return '${difference.inMinutes} min ago';
    return 'Just now';
  }

  String _formatSalary(double? min, double? max, NumberFormat formatter) {
    if (min != null && max != null) {
      return '₹${formatter.format(min)} - ₹${formatter.format(max)}';
    }
    return 'Salary Negotiable';
  }

  String _getFriendlyJobType(JobType type) {
    switch (type) {
      case JobType.fullTime:
        return 'Full Time';
      case JobType.partTime:
        return 'Part Time';
      case JobType.internship:
        return 'Internship';
      case JobType.remote:
        return 'Remote';
      case JobType.workFromHome:
        return 'WFH';
      case JobType.fresher:
        return 'Fresher';
      case JobType.contract:
        return 'Contract';
    }
  }

  Future<void> _toggleSaveJob(Job job, List<String> savedJobIds, String? userId) async {
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to save jobs')),
      );
      return;
    }

    final isSaved = savedJobIds.contains(job.id);
    final firestore = FirebaseFirestore.instance;

    try {
      if (isSaved) {
        // Find saved record and delete
        final snap = await firestore
            .collection('savedJobs')
            .where('userId', isEqualTo: userId)
            .where('jobId', isEqualTo: job.id)
            .get();
        for (var doc in snap.docs) {
          await doc.reference.delete();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job removed from saved list')),
        );
      } else {
        // Add to saved list
        await firestore.collection('savedJobs').add({
          'userId': userId,
          'jobId': job.id,
          'jobTitle': job.title,
          'companyName': job.companyName,
          'description': 'Positions available at ${job.companyName}. Required skills: ${job.skills.join(", ")}',
          'district': job.location,
          'jobType': job.jobType.toJson(),
          'salaryMin': job.salaryMin ?? 0,
          'salaryMax': job.salaryMax ?? 0,
          'skills': job.skills,
          'deadline': job.deadline != null ? Timestamp.fromDate(job.deadline!) : null,
          'savedAt': FieldValue.serverTimestamp(),
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Job saved successfully')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save job: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final allJobsAsync = ref.watch(allJobsProvider);
    final savedJobsAsync = ref.watch(savedJobsStreamProvider);
    final authState = ref.watch(authStateStreamProvider);

    final user = authState.value;
    final savedJobIds = savedJobsAsync.value ?? [];

    final isWide = MediaQuery.of(context).size.width > 768;
    final formatter = NumberFormat.decimalPattern('en_IN');

    // 1. Filter jobs
    final allJobs = allJobsAsync.value ?? [];
    final filteredJobs = allJobs.where((j) {
      final q = _searchQuery.toLowerCase();
      final matchSearch = q.isEmpty ||
          j.title.toLowerCase().contains(q) ||
          j.companyName.toLowerCase().contains(q) ||
          j.skills.any((s) => s.toLowerCase().contains(q));

      final matchLoc = _selectedLocation.isEmpty ||
          j.location.toLowerCase().contains(_selectedLocation.toLowerCase()) ||
          j.district.toLowerCase().contains(_selectedLocation.toLowerCase());

      final friendlyType = _getFriendlyJobType(j.jobType);
      final matchType = _selectedTypes.isEmpty || _selectedTypes.contains(friendlyType);

      final matchCat = _selectedCategories.isEmpty || _selectedCategories.contains(j.category);

      return matchSearch && matchLoc && matchType && matchCat;
    }).toList();

    // 2. Sort jobs
    filteredJobs.sort((a, b) {
      if (_sortBy == 'salary') {
        final valA = a.salaryMax ?? 0.0;
        final valB = b.salaryMax ?? 0.0;
        return valB.compareTo(valA);
      } else if (_sortBy == 'relevance') {
        if (_searchQuery.isEmpty) return 0;
        final q = _searchQuery.toLowerCase();
        int scoreA = 0;
        if (a.title.toLowerCase().contains(q)) scoreA += 2;
        if (a.skills.any((s) => s.toLowerCase().contains(q))) scoreA += 1;

        int scoreB = 0;
        if (b.title.toLowerCase().contains(q)) scoreB += 2;
        if (b.skills.any((s) => s.toLowerCase().contains(q))) scoreB += 1;

        return scoreB.compareTo(scoreA);
      } else {
        // 'latest'
        return b.createdAt.compareTo(a.createdAt);
      }
    });

    final activeFilters = _selectedTypes.length + _selectedCategories.length;

    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: const Text('Jobs Directory'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(allJobsProvider);
          },
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Search & Sticky area
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  child: Center(
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 1100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              // Search input
                              Expanded(
                                flex: 3,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: TailwindColors.slate.shade50,
                                    border: Border.all(color: TailwindColors.slate.shade200),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.search, size: 16, color: Colors.grey),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: TextField(
                                          controller: _searchController,
                                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                                          decoration: InputDecoration(
                                            hintText: 'Job title, skill, company...',
                                            hintStyle: TextStyle(
                                              color: TailwindColors.slate.shade400,
                                              fontSize: 12,
                                              fontWeight: FontWeight.normal,
                                            ),
                                            border: InputBorder.none,
                                            isDense: true,
                                          ),
                                        ),
                                      ),
                                      if (_searchQuery.isNotEmpty)
                                        IconButton(
                                          onPressed: () => _searchController.clear(),
                                          icon: const Icon(Icons.close, size: 16, color: Colors.grey),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Location Dropdown
                              Expanded(
                                flex: 2,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: TailwindColors.slate.shade50,
                                    border: Border.all(color: TailwindColors.slate.shade200),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on, size: 14, color: Colors.teal),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: _selectedLocation.isEmpty ? null : _selectedLocation,
                                            hint: const Text('All Areas', style: TextStyle(fontSize: 12, color: Colors.grey)),
                                            style: TextStyle(color: TailwindColors.slate.shade700, fontWeight: FontWeight.bold, fontSize: 12),
                                            items: ['Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Remote']
                                                .map((loc) => DropdownMenuItem(value: loc, child: Text(loc)))
                                                .toList(),
                                            onChanged: (val) {
                                              setState(() {
                                                _selectedLocation = val ?? '';
                                              });
                                            },
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Filter Toggle Button
                              ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _showFilters = !_showFilters;
                                  });
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _showFilters || activeFilters > 0
                                      ? AppTheme.primaryPurple.withOpacity(0.12)
                                      : TailwindColors.slate.shade50,
                                  foregroundColor: _showFilters || activeFilters > 0
                                      ? AppTheme.primaryPurple
                                      : TailwindColors.slate.shade600,
                                  surfaceTintColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    side: BorderSide(
                                      color: _showFilters || activeFilters > 0
                                          ? AppTheme.primaryPurple.withOpacity(0.4)
                                          : TailwindColors.slate.shade200,
                                    ),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.tune, size: 16),
                                    if (activeFilters > 0) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        width: 18,
                                        height: 18,
                                        decoration: const BoxDecoration(
                                          color: AppTheme.primaryPurple,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Center(
                                          child: Text(
                                            '$activeFilters',
                                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),

                          // Filter Panel Expansion
                          if (_showFilters) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                border: Border.all(color: TailwindColors.slate.shade200),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Job Type list
                                  const Text('Job Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _jobTypesList.map((type) {
                                      final isSelected = _selectedTypes.contains(type);
                                      return FilterChip(
                                        label: Text(type, style: const TextStyle(fontSize: 11)),
                                        selected: isSelected,
                                        onSelected: (selected) {
                                          setState(() {
                                            if (selected) {
                                              _selectedTypes.add(type);
                                            } else {
                                              _selectedTypes.remove(type);
                                            }
                                          });
                                        },
                                        selectedColor: AppTheme.primaryPurple.withOpacity(0.15),
                                        checkmarkColor: AppTheme.primaryPurple,
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: 16),

                                  // Category list
                                  const Text('Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: _categoriesList.map((cat) {
                                      final isSelected = _selectedCategories.contains(cat);
                                      return FilterChip(
                                        label: Text(cat, style: const TextStyle(fontSize: 11)),
                                        selected: isSelected,
                                        onSelected: (selected) {
                                          setState(() {
                                            if (selected) {
                                              _selectedCategories.add(cat);
                                            } else {
                                              _selectedCategories.remove(cat);
                                            }
                                          });
                                        },
                                        selectedColor: AppTheme.brandCyan.withOpacity(0.15),
                                        checkmarkColor: AppTheme.brandCyan,
                                      );
                                    }).toList(),
                                  ),

                                  if (activeFilters > 0) ...[
                                    const SizedBox(height: 16),
                                    TextButton.icon(
                                      onPressed: () {
                                        setState(() {
                                          _selectedTypes.clear();
                                          _selectedCategories.clear();
                                        });
                                      },
                                      icon: const Icon(Icons.clear_all, size: 16, color: Colors.red),
                                      label: const Text('Clear all filters', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Main Listing Grid
                Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 1100),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        // Results Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${filteredJobs.length} Jobs Found',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                                ),
                                Text(
                                  _searchQuery.isNotEmpty ? 'Results for "$_searchQuery"' : 'All available positions',
                                  style: TextStyle(fontSize: 11, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            // Sort Dropdown
                            Row(
                              children: [
                                Text('Sort: ', style: TextStyle(fontSize: 11, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold)),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    border: Border.all(color: TailwindColors.slate.shade200),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _sortBy,
                                      style: TextStyle(color: TailwindColors.slate.shade700, fontSize: 11, fontWeight: FontWeight.bold),
                                      items: const [
                                        DropdownMenuItem(value: 'latest', child: Text('Latest')),
                                        DropdownMenuItem(value: 'salary', child: Text('Salary')),
                                        DropdownMenuItem(value: 'relevance', child: Text('Relevance')),
                                      ],
                                      onChanged: (val) {
                                        if (val != null) {
                                          setState(() {
                                            _sortBy = val;
                                          });
                                        }
                                      },
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // List of Job Cards
                        allJobsAsync.when(
                          data: (jobsList) {
                            if (filteredJobs.isEmpty) {
                              return _buildEmptyState();
                            }
                            return ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: filteredJobs.length,
                              itemBuilder: (context, index) {
                                final job = filteredJobs[index];
                                final isSaved = savedJobIds.contains(job.id);
                                final salaryStr = _formatSalary(job.salaryMin, job.salaryMax, formatter);
                                final timeStr = _formatTime(job.createdAt);
                                final typeStr = _getFriendlyJobType(job.jobType);

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: TailwindColors.slate.shade200),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.01),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // Logo placeholder
                                          Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: TailwindColors.slate.shade50,
                                              border: Border.all(color: TailwindColors.slate.shade200),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Center(
                                              child: Text(
                                                job.companyName.isNotEmpty ? job.companyName.substring(0, 1).toUpperCase() : '💼',
                                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 12),

                                          // Details
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                InkWell(
                                                  onTap: () => context.push('/jobs/${job.id}'),
                                                  child: Text(
                                                    job.title,
                                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Row(
                                                  children: [
                                                    Text(
                                                      job.companyName.isNotEmpty ? job.companyName : 'Verified Employer',
                                                      style: TextStyle(fontSize: 11, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                                    ),
                                                    const SizedBox(width: 4),
                                                    const Icon(Icons.verified_user, color: Colors.teal, size: 12),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),

                                          // Badges
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              if (job.isUrgent)
                                                Container(
                                                  margin: const EdgeInsets.only(bottom: 4),
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFFFFBEB),
                                                    border: Border.all(color: const Color(0xFFFDE68A)),
                                                    borderRadius: BorderRadius.circular(100),
                                                  ),
                                                  child: const Text('URGENT', style: TextStyle(color: Color(0xFFB45309), fontSize: 8, fontWeight: FontWeight.bold)),
                                                ),
                                              if (job.isPremium)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFEFF6FF),
                                                    border: Border.all(color: const Color(0xFFBFDBFE)),
                                                    borderRadius: BorderRadius.circular(100),
                                                  ),
                                                  child: const Text('PREMIUM', style: TextStyle(color: Color(0xFF1D4ED8), fontSize: 8, fontWeight: FontWeight.bold)),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),

                                      // Meta Row
                                      Wrap(
                                        spacing: 12,
                                        runSpacing: 4,
                                        children: [
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.location_on_outlined, size: 12, color: Colors.teal),
                                              const SizedBox(width: 4),
                                              Text(
                                                job.location.isNotEmpty ? job.location : job.district,
                                                style: TextStyle(fontSize: 10, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.payments_outlined, size: 12, color: Colors.emerald),
                                              const SizedBox(width: 4),
                                              Text(
                                                salaryStr,
                                                style: TextStyle(fontSize: 10, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.work_outline, size: 12, color: Colors.cyan),
                                              const SizedBox(width: 4),
                                              Text(
                                                typeStr,
                                                style: TextStyle(fontSize: 10, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.schedule, size: 12, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Text(
                                                timeStr,
                                                style: TextStyle(fontSize: 10, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),

                                      // Skills chips
                                      if (job.skills.isNotEmpty) ...[
                                        Wrap(
                                          spacing: 4,
                                          runSpacing: 4,
                                          children: job.skills.map((skill) {
                                            return Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: TailwindColors.slate.shade100,
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              child: Text(
                                                skill,
                                                style: TextStyle(color: TailwindColors.slate.shade600, fontSize: 9, fontWeight: FontWeight.bold),
                                              ),
                                            );
                                          }).toList(),
                                        ),
                                        const SizedBox(height: 12),
                                      ],

                                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                      const SizedBox(height: 8),

                                      // Actions
                                      Row(
                                        children: [
                                          Expanded(
                                            child: SizedBox(
                                              height: 38,
                                              child: ElevatedButton(
                                                onPressed: () => context.push('/jobs/${job.id}'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: const Color(0xFF0F172A),
                                                  foregroundColor: Colors.white,
                                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                  elevation: 0,
                                                ),
                                                child: const Text('Apply Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          SizedBox(
                                            width: 38,
                                            height: 38,
                                            child: IconButton(
                                              onPressed: () => _toggleSaveJob(job, savedJobIds, user?.uid),
                                              icon: Icon(
                                                isSaved ? Icons.bookmark : Icons.bookmark_border,
                                                color: isSaved ? AppTheme.primaryPurple : TailwindColors.slate.shade500,
                                                size: 18,
                                              ),
                                              style: IconButton.styleFrom(
                                                backgroundColor: isSaved
                                                    ? AppTheme.primaryPurple.withOpacity(0.12)
                                                    : TailwindColors.slate.shade50,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius: BorderRadius.circular(10),
                                                  side: BorderSide(
                                                    color: isSaved
                                                        ? AppTheme.primaryPurple.withOpacity(0.4)
                                                        : TailwindColors.slate.shade200,
                                                  ),
                                                ),
                                                padding: EdgeInsets.zero,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              },
                            );
                          },
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(48.0),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (err, stack) => _buildEmptyState(),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const HomeFooter(),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: const FloatingWhatsApp(),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: TailwindColors.slate.shade300),
      ),
      child: Column(
        children: [
          const Text(
            'No jobs found',
            style: TextStyle(fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 6),
          Text(
            'Try adjusting your search query or clear filters.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _searchController.clear();
                _selectedLocation = '';
                _selectedTypes.clear();
                _selectedCategories.clear();
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
            child: const Text('Clear Filters', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
