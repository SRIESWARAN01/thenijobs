// ============================================================
// THENIJOBS — Job Detail Screen
// ============================================================

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:thenijobs/core/theme/app_theme.dart';
import 'package:thenijobs/features/auth/presentation/providers/auth_provider.dart';
import 'package:thenijobs/shared/data/models/job_model.dart';
import 'package:thenijobs/shared/data/models/seeker_profile_model.dart';
import 'package:thenijobs/features/public/presentation/providers/stats_provider.dart';
import 'package:thenijobs/features/public/presentation/widgets/home_footer.dart';
import 'package:thenijobs/shared/widgets/floating_whatsapp.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  bool _isSaved = false;
  bool _hasApplied = false;
  bool _checkingStatus = true;
  bool _applying = false;

  @override
  void initState() {
    super.initState();
    _checkSavedAndAppliedStatus();
  }

  Future<void> _checkSavedAndAppliedStatus() async {
    final userId = ref.read(authStateStreamProvider).value?.uid;
    if (userId == null) {
      if (mounted) {
        setState(() => _checkingStatus = false);
      }
      return;
    }

    try {
      final firestore = FirebaseFirestore.instance;

      // Check saved
      final savedSnap = await firestore
          .collection('savedJobs')
          .where('userId', isEqualTo: userId)
          .where('jobId', isEqualTo: widget.jobId)
          .get();

      // Check applied
      final appliedSnap = await firestore
          .collection('applications')
          .where('seekerId', isEqualTo: userId)
          .where('jobId', isEqualTo: widget.jobId)
          .get();

      if (mounted) {
        setState(() {
          _isSaved = savedSnap.docs.isNotEmpty;
          _hasApplied = appliedSnap.docs.isNotEmpty;
          _checkingStatus = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking status: $e');
      if (mounted) {
        setState(() => _checkingStatus = false);
      }
    }
  }

  Future<void> _toggleSaveJob(Job job, String? userId) async {
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please login to save this job')),
      );
      return;
    }

    final firestore = FirebaseFirestore.instance;
    setState(() => _isSaved = !_isSaved);

    try {
      if (!_isSaved) {
        // Remove from saved list
        final snap = await firestore
            .collection('savedJobs')
            .where('userId', isEqualTo: userId)
            .where('jobId', isEqualTo: job.id)
            .get();
        for (var doc in snap.docs) {
          await doc.reference.delete();
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Job removed from saved list')),
          );
        }
      } else {
        // Add to saved list
        await firestore.collection('savedJobs').add({
          'userId': userId,
          'jobId': job.id,
          'jobTitle': job.title,
          'companyName': job.companyName,
          'description': job.description,
          'district': job.location.isNotEmpty ? job.location : job.district,
          'jobType': job.jobType.toJson(),
          'salaryMin': job.salaryMin ?? 0,
          'salaryMax': job.salaryMax ?? 0,
          'skills': job.skills,
          'deadline': job.deadline != null ? Timestamp.fromDate(job.deadline!) : null,
          'savedAt': FieldValue.serverTimestamp(),
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Job saved successfully')),
          );
        }
      }
    } catch (e) {
      setState(() => _isSaved = !_isSaved); // Revert UI state
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update saved status: $e')),
        );
      }
    }
  }

  Future<void> _applyToJob(Job job, String userId, String seekerName, String resumeUrl, String coverLetter) async {
    setState(() => _applying = true);
    final firestore = FirebaseFirestore.instance;
    final batch = firestore.batch();

    final applicationRef = firestore.collection('applications').doc();

    batch.set(applicationRef, {
      'jobId': job.id,
      'companyId': job.companyId,
      'seekerId': userId,
      'seekerName': seekerName,
      'jobTitle': job.title,
      'companyName': job.companyName,
      'resumeUrl': resumeUrl,
      'coverLetter': coverLetter,
      'status': 'applied',
      'appliedAt': FieldValue.serverTimestamp(),
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
      'statusTimestamps': {
        'applied': FieldValue.serverTimestamp(),
      },
    });

    batch.update(firestore.collection('jobs').doc(job.id), {
      'applicationCount': FieldValue.increment(1),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    try {
      await batch.commit();

      // Log activity
      await firestore.collection('activityLogs').add({
        'userId': userId,
        'userName': seekerName,
        'action': 'Applied to job',
        'target': job.id,
        'targetId': job.id,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Find company owner ID for notification delivery
      String notifyUserId = job.companyId;
      try {
        final companyDoc = await firestore.collection('companies').doc(job.companyId).get();
        if (companyDoc.exists && companyDoc.data()?['ownerId'] != null) {
          notifyUserId = companyDoc.data()!['ownerId'] as String;
        }
      } catch (e) {
        debugPrint('Error looking up company owner: $e');
      }

      // Create notification
      await firestore.collection('notifications').add({
        'userId': notifyUserId,
        'type': 'application_update',
        'title': 'New Job Application',
        'message': '$seekerName applied to ${job.title}',
        'actionUrl': '/employer/candidates',
        'createdBy': userId,
        'read': false,
        'createdAt': FieldValue.serverTimestamp(),
      });

      if (mounted) {
        setState(() {
          _hasApplied = true;
          _applying = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _applying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit application: $e')),
        );
      }
    }
  }

  void _showApplyBottomSheet(Job job, JobSeekerProfile? profile, String userId) {
    if (profile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not load seeker profile. Please verify your profile info.')),
      );
      return;
    }

    final resumes = profile.resumes;
    String selectedResumeUrl = resumes.isNotEmpty 
        ? (resumes.firstWhere((r) => r.isDefault, orElse: () => resumes.first).url ?? '') 
        : (profile.resumeUrl ?? '');

    String selectedResumeId = resumes.isNotEmpty 
        ? resumes.firstWhere((r) => r.isDefault, orElse: () => resumes.first).id 
        : '';

    final coverLetterController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 16,
                top: 24,
                left: 20,
                right: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'Apply for ${job.title}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (resumes.isEmpty && (profile.resumeUrl == null || profile.resumeUrl!.isEmpty)) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        border: Border.all(color: Colors.amber.shade200),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 28),
                          const SizedBox(height: 8),
                          const Text(
                            'No resume found in your profile.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Please upload or build a resume in your seeker profile dashboard first.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              context.push('/seeker/resume');
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: const Text('Manage Resumes', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ] else ...[
                    if (resumes.isNotEmpty) ...[
                      const Text(
                        'Select Resume',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: TailwindColors.slate.shade50,
                          border: Border.all(color: TailwindColors.slate.shade200),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: selectedResumeId,
                            isExpanded: true,
                            items: resumes.map((r) {
                              return DropdownMenuItem<String>(
                                value: r.id,
                                child: Text('${r.name} (${r.uploadDate})', style: const TextStyle(fontSize: 12)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                final res = resumes.firstWhere((r) => r.id == val);
                                setModalState(() {
                                  selectedResumeId = val;
                                  selectedResumeUrl = res.url ?? '';
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else ...[
                      // Single resume URL fallback
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: TailwindColors.slate.shade50,
                          border: Border.all(color: TailwindColors.slate.shade200),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.file_present, color: Colors.teal),
                            const SizedBox(width: 8),
                            const Expanded(
                              child: Text(
                                'Profile Default Resume',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                            Text(
                              profile.resumeUrl!.split('/').last.split('_').last,
                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    const Text(
                      'Cover Letter / Message to Recruiter',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: coverLetterController,
                      maxLines: 4,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: "Briefly state why you're a good fit for this role...",
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                        filled: true,
                        fillColor: TailwindColors.slate.shade50,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: TailwindColors.slate.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: TailwindColors.slate.shade200),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.of(context).pop(),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: TailwindColors.slate.shade200),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text('Cancel', style: TextStyle(color: Colors.black87, fontSize: 12)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _applying 
                                ? null 
                                : () async {
                                    Navigator.of(context).pop();
                                    await _applyToJob(
                                      job,
                                      userId,
                                      profile.name.isNotEmpty ? profile.name : (ref.read(authStateStreamProvider).value?.displayName ?? 'Job Seeker'),
                                      selectedResumeUrl,
                                      coverLetterController.text.trim(),
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F172A),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text('Submit Application', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'Recently';
    final difference = DateTime.now().difference(dateTime);
    if (difference.inDays >= 1) return '${difference.inDays} d ago';
    if (difference.inHours >= 1) return '${difference.inHours} hr ago';
    if (difference.inMinutes >= 1) return '${difference.inMinutes} min ago';
    return 'Just now';
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

  @override
  Widget build(BuildContext context) {
    final jobAsync = ref.watch(jobDetailProvider(widget.jobId));
    final seekerProfileAsync = ref.watch(seekerProfileProvider);
    final authState = ref.watch(authStateStreamProvider);

    final user = authState.value;
    final formatter = NumberFormat.decimalPattern('en_IN');

    return Scaffold(
      backgroundColor: AppTheme.lightBg,
      appBar: AppBar(
        title: const Text('Job Details'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 1,
        actions: [
          jobAsync.when(
            data: (job) {
              if (job == null) return const SizedBox();
              return IconButton(
                onPressed: () => _toggleSaveJob(job, user?.uid),
                icon: Icon(
                  _isSaved ? Icons.bookmark : Icons.bookmark_border,
                  color: _isSaved ? AppTheme.primaryPurple : TailwindColors.slate.shade600,
                ),
              );
            },
            loading: () => const SizedBox(),
            error: (_, __) => const SizedBox(),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: jobAsync.when(
          data: (job) {
            if (job == null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'Job Not Found',
                        style: TextStyle(fontFamily: 'Outfit', fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text('This job posting may have expired or been deleted.'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => context.pop(),
                        child: const Text('Back to Jobs'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final salaryStr = job.salaryMin != null && job.salaryMax != null
                ? '₹${formatter.format(job.salaryMin)} - ₹${formatter.format(job.salaryMax)}'
                : 'Salary Negotiable';

            final timeStr = _formatTime(job.createdAt);
            final typeStr = _getFriendlyJobType(job.jobType);

            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Main Content Card
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Company Logo and Badges Row
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: TailwindColors.slate.shade50,
                                border: Border.all(color: TailwindColors.slate.shade200),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Center(
                                child: Text(
                                  job.companyName.isNotEmpty ? job.companyName.substring(0, 1).toUpperCase() : '💼',
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    job.title,
                                    style: const TextStyle(
                                      fontFamily: 'Outfit',
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F172A),
                                      height: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Text(
                                        job.companyName.isNotEmpty ? job.companyName : 'Verified Employer',
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: TailwindColors.slate.shade500,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.verified, color: Colors.teal, size: 14),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Tags (Urgent, Premium)
                        Row(
                          children: [
                            if (job.isUrgent)
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFFFBEB),
                                  border: Border.all(color: const Color(0xFFFDE68A)),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.flash_on, color: Color(0xFFB45309), size: 12),
                                    SizedBox(width: 4),
                                    Text('URGENT', style: TextStyle(color: Color(0xFFB45309), fontSize: 9, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            if (job.isPremium)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  border: Border.all(color: const Color(0xFFBFDBFE)),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: const Text('PREMIUM', style: TextStyle(color: Color(0xFF1D4ED8), fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Details list
                        _buildDetailRow(Icons.location_on_outlined, 'Location', '${job.location}, ${job.district}', Colors.teal),
                        _buildDetailRow(Icons.payments_outlined, 'Salary', '$salaryStr / Month', Colors.emerald),
                        _buildDetailRow(Icons.work_outline, 'Job Type', typeStr.toUpperCase(), Colors.cyan),
                        _buildDetailRow(Icons.people_outline, 'Openings', '${job.openings} positions available', Colors.blueGrey),
                        _buildDetailRow(Icons.schedule, 'Posted Date', 'Posted $timeStr', Colors.grey),

                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 16),

                        // Apply Buttons Row
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 48,
                                child: _checkingStatus
                                    ? const Center(child: CircularProgressIndicator())
                                    : _hasApplied
                                        ? ElevatedButton(
                                            onPressed: null,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: Colors.teal.shade50,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              elevation: 0,
                                            ),
                                            child: const Text('Applied ✓', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.teal)),
                                          )
                                        : ElevatedButton(
                                            onPressed: () {
                                              if (user == null) {
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(content: Text('Please login to apply')),
                                                );
                                                context.push('/login');
                                                return;
                                              }
                                              _showApplyBottomSheet(job, seekerProfileAsync.value, user.uid);
                                            },
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: const Color(0xFF0F172A),
                                              foregroundColor: Colors.white,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              elevation: 0,
                                            ),
                                            child: const Text('Apply Now', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                                          ),
                              ),
                            ),
                          ],
                        ),
                        
                        // WhatsApp and Call deep links
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 44,
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    final whatsappNum = job.phone ?? '919876543210';
                                    final cleanNum = whatsappNum.replaceAll(RegExp(r'[^0-9]'), '');
                                    final text = 'Hi, I am interested in the ${job.title} position at ${job.companyName} listed on TheNiJobs.';
                                    final url = Uri.parse('https://wa.me/$cleanNum?text=${Uri.encodeComponent(text)}');
                                    if (await canLaunchUrl(url)) {
                                      await launchUrl(url, mode: LaunchMode.externalApplication);
                                    } else {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Could not open WhatsApp')),
                                        );
                                      }
                                    }
                                  },
                                  icon: const Icon(Icons.message, size: 16),
                                  label: const Text('WhatsApp Apply', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF25D366),
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    elevation: 0,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (job.postedBy.isNotEmpty)
                              Expanded(
                                child: SizedBox(
                                  height: 44,
                                  child: OutlinedButton.icon(
                                    onPressed: () async {
                                      final phoneNum = job.postedBy; // postedBy stores HR phone number in Next.js in some collections or alternates
                                      // Or fallback to standard query
                                      String phoneToCall = phoneNum;
                                      if (!RegExp(r'^[0-9+]+$').hasMatch(phoneToCall)) {
                                        // fetch company phone
                                        try {
                                          final companyDoc = await FirebaseFirestore.instance.collection('companies').doc(job.companyId).get();
                                          if (companyDoc.exists && companyDoc.data()?['phone'] != null) {
                                            phoneToCall = companyDoc.data()!['phone'] as String;
                                          }
                                        } catch (e) {
                                          debugPrint('Error fetching phone: $e');
                                        }
                                      }
                                      final url = Uri.parse('tel:$phoneToCall');
                                      if (await canLaunchUrl(url)) {
                                        await launchUrl(url);
                                      } else {
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Could not initiate call')),
                                          );
                                        }
                                      }
                                    },
                                    icon: const Icon(Icons.phone, size: 16),
                                    label: const Text('Call HR', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.black87,
                                      side: BorderSide(color: TailwindColors.slate.shade300),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Specifications Card
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Quick Specifications', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _buildSpecBox('Experience', job.experience, '💼'),
                            _buildSpecBox('Education', job.education ?? 'Any Degree', '🎓'),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _buildSpecBox('Openings', '${job.openings} Posts', '👥'),
                            _buildSpecBox('Deadline', job.deadline != null ? DateFormat('dd MMM yyyy').format(job.deadline!) : 'N/A', '📅'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Job Description
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Job Description', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                        const SizedBox(height: 12),
                        Text(
                          job.description,
                          style: TextStyle(
                            fontSize: 13,
                            color: TailwindColors.slate.shade700,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Key Requirements
                  if (job.requirements.isNotEmpty)
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Key Requirements', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                          const SizedBox(height: 12),
                          Column(
                            children: job.requirements.map((req) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('▸ ', style: TextStyle(color: AppTheme.primaryPurple, fontWeight: FontWeight.bold)),
                                    Expanded(
                                      child: Text(
                                        req,
                                        style: TextStyle(fontSize: 13, color: TailwindColors.slate.shade700),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  if (job.requirements.isNotEmpty) const SizedBox(height: 12),

                  // Required Skills
                  if (job.skills.isNotEmpty)
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Required Skills', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF0F172A))),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: job.skills.map((skill) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryPurple.withOpacity(0.08),
                                  border: Border.all(color: AppTheme.primaryPurple.withOpacity(0.2)),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  skill,
                                  style: const TextStyle(
                                    color: AppTheme.primaryPurple,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  if (job.skills.isNotEmpty) const SizedBox(height: 12),

                  // Job Alerts Banner
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.cyan.shade50,
                      border: Border.all(color: Colors.cyan.shade200),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.notifications_active, color: Colors.cyan),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Job Alerts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF0F172A))),
                              const SizedBox(height: 4),
                              Text(
                                '${job.location} பகுதியில் இதுபோன்ற jobs வந்தவுடன் mobile alert பெறலாம்.',
                                style: TextStyle(fontSize: 11, color: TailwindColors.slate.shade700, height: 1.4),
                              ),
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: () => context.push('/seeker/job-alerts'),
                                child: const Row(
                                  children: [
                                    Text('Create Job Alert ', style: TextStyle(color: Colors.cyan, fontSize: 11, fontWeight: FontWeight.bold)),
                                    Icon(Icons.chevron_right, size: 14, color: Colors.cyan),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  const HomeFooter(),
                ],
              ),
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(48.0),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (err, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Text('Error loading job details: $err'),
            ),
          ),
        ),
      ),
      floatingActionButton: const FloatingWhatsApp(),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: iconColor),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(fontSize: 11, color: TailwindColors.slate.shade500, fontWeight: FontWeight.bold),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecBox(String label, String value, String icon) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: TailwindColors.slate.shade50,
          border: Border.all(color: TailwindColors.slate.shade200),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 9, color: Colors.grey.shade600, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
          ],
        ),
      ),
    );
  }
}
