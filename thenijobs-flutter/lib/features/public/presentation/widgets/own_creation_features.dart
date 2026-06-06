// ============================================================
// THENIJOBS — OwnCreationFeatures Widget (Bilingual)
// ============================================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:thenijobs/core/theme/app_theme.dart';

class OwnCreationFeatures extends StatefulWidget {
  const OwnCreationFeatures({super.key});

  @override
  State<OwnCreationFeatures> createState() => _OwnCreationFeaturesState();
}

class _OwnCreationFeaturesState extends State<OwnCreationFeatures> {
  String _language = 'en'; // 'en' or 'ta'

  // Text copies for localization
  final Map<String, Map<String, String>> _copy = {
    'en': {
      'eyebrow': 'Full own creation update',
      'title': 'THENIJOBS as a complete mobile-first local career app',
      'intro':
          'This section presents the original product idea clearly: jobs, businesses, leads, interviews, rewards and admin approvals in one practical Theni-focused mobile workflow.',
      'languageLabel': 'Language',
      'mobileTitle': 'Mobile app flow',
      'mobileText': 'Search, filter, apply, call, WhatsApp and track rewards without leaving the main journey.',
      'proofTitle': 'Made for Theni proof',
      'proofText': 'Live stats, area filters, verified business trust and recent activity can prove the platform is built for local use.',
      'primaryCta': 'Create account',
      'secondaryCta': 'Post a job',
    },
    'ta': {
      'eyebrow': 'முழு own creation update',
      'title': 'THENIJOBS ஒரு mobile-first local career app',
      'intro':
          'Jobs, business pages, leads, interviews, rewards, admin approvals எல்லாமே Theni users காக ஒரே mobile workflow-ல் காட்டப்படுகிறது.',
      'languageLabel': 'மொழி',
      'mobileTitle': 'Mobile app flow',
      'mobileText': 'Search, filter, apply, call, WhatsApp, rewards track எல்லாம் easy mobile journey.',
      'proofTitle': 'Theni காக உருவாக்கியது',
      'proofText': 'Live stats, area filters, verified business badge, recent activity மூலம் local trust அதிகமாகும்.',
      'primaryCta': 'Account உருவாக்க',
      'secondaryCta': 'Job post செய்ய',
    },
  };

  // Ownership points
  final List<Map<String, String>> _ownershipPoints = const [
    {
      'en': 'Village/area filters: Theni, Periyakulam, Cumbum, Bodinayakanur',
      'ta': 'Area filters: Theni, Periyakulam, Cumbum, Bodinayakanur'
    },
    {
      'en': 'Admin approval timeline for jobs, businesses, reviews and ads',
      'ta': 'Jobs, businesses, reviews, ads காக admin approval timeline'
    },
    {
      'en': 'Reward points for profile completion, applications, referrals and interviews',
      'ta': 'Profile, apply, referral, interview காக reward points'
    },
    {
      'en': 'Live activity proof from Firebase-backed platform data',
      'ta': 'Firebase live data மூலம் platform activity proof'
    },
  ];

  // Feature cards definitions
  final List<Map<String, dynamic>> _featureCards = const [
    {
      'title': 'Tamil + English toggle',
      'titleTa': 'Tamil + English toggle',
      'text': 'Let local users switch copy, actions and labels into the language they are comfortable using.',
      'textTa': 'Users English/Tamil language easy-ஆ switch பண்ணி use செய்யலாம்.',
      'icon': Icons.translate_rounded,
      'color': Colors.teal,
      'bgColor': Color(0xFFF0FDFA),
    },
    {
      'title': 'Smart job match score',
      'titleTa': 'Smart job match score',
      'text': 'Show a match percentage using skills, area, salary expectation and experience fit.',
      'textTa': 'Skills, area, salary, experience வைத்து match percentage காட்டலாம்.',
      'icon': Icons.speed_outlined,
      'color': Colors.blue,
      'bgColor': Color(0xFFEFF6FF),
    },
    {
      'title': 'Verified business badge',
      'titleTa': 'Verified business badge',
      'text': 'Build trust with verified local companies, documents, contact checks and visible badges.',
      'textTa': 'Verified companies badge மூலம் local trust அதிகமாகும்.',
      'icon': Icons.verified_user_outlined,
      'color': TailwindColors.emerald,
      'bgColor': Color(0xFFECFDF5),
    },
    {
      'title': 'WhatsApp lead tracking',
      'titleTa': 'WhatsApp lead tracking',
      'text': 'Track who called, messaged, clicked WhatsApp or asked for a service from a business page.',
      'textTa': 'Call, WhatsApp, inquiry எல்லா leads-யும் track செய்யலாம்.',
      'icon': Icons.chat_bubble_outline_rounded,
      'color': Colors.amber,
      'bgColor': Color(0xFFFFFBEB),
    },
    {
      'title': 'Resume builder templates',
      'titleTa': 'Resume builder templates',
      'text': 'Give local job-ready resume formats for freshers, experienced workers and service roles.',
      'textTa': 'Freshers, experienced, service jobs காக resume templates.',
      'icon': Icons.assignment_outlined,
      'color': Colors.red,
      'bgColor': Color(0xFFFFF1F2),
    },
    {
      'title': 'Hiring urgency badges',
      'titleTa': 'Hiring urgency badges',
      'text': 'Feature employers with labels like urgent hiring, walk-in, verified salary and immediate joining.',
      'textTa': 'Urgent hiring, walk-in, salary verified badges employer list-ல்.',
      'icon': Icons.star_outline_rounded,
      'color': Colors.purple,
      'bgColor': Color(0xFFFDF4FF),
    },
  ];

  // Journeys mapping
  final List<Map<String, dynamic>> _journeys = const [
    {
      'role': 'Job seeker',
      'roleTa': 'வேலை தேடுபவர்',
      'title': 'Search job to rewards',
      'titleTa': 'Job search முதல் rewards வரை',
      'proof': '92% match + 120 reward points',
      'proofTa': '92% match + 120 reward points',
      'icon': Icons.person_search_outlined,
      'color': Colors.teal,
      'bgColor': Color(0xFFF0FDFA),
      'steps': [
        {'label': 'Search job', 'labelTa': 'Job தேடு', 'icon': Icons.search},
        {'label': 'Match score', 'labelTa': 'Match score', 'icon': Icons.speed},
        {'label': 'Apply', 'labelTa': 'Apply', 'icon': Icons.send},
        {'label': 'Interview', 'labelTa': 'Interview', 'icon': Icons.calendar_month},
        {'label': 'Rewards', 'labelTa': 'Rewards', 'icon': Icons.card_giftcard},
      ],
    },
    {
      'role': 'Employer',
      'roleTa': 'Employer',
      'title': 'Post job to hire',
      'titleTa': 'Job post முதல் hire வரை',
      'proof': 'Shortlist, message and hire faster',
      'proofTa': 'Shortlist, message, hire வேகமாக',
      'icon': Icons.business_center_outlined,
      'color': Colors.blue,
      'bgColor': Color(0xFFEFF6FF),
      'steps': [
        {'label': 'Post job', 'labelTa': 'Job post', 'icon': Icons.post_add},
        {'label': 'Candidates', 'labelTa': 'Candidates', 'icon': Icons.people},
        {'label': 'Shortlist', 'labelTa': 'Shortlist', 'icon': Icons.check_circle_outline},
        {'label': 'Message', 'labelTa': 'Message', 'icon': Icons.chat_outlined},
        {'label': 'Hire', 'labelTa': 'Hire', 'icon': Icons.verified_outlined},
      ],
    },
  ];

  @override
  Widget build(BuildContext context) {
    final t = _copy[_language]!;
    final isWide = MediaQuery.of(context).size.width > 900;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 5, child: _buildLeftPanel(t)),
                        const SizedBox(width: 48),
                        Expanded(flex: 6, child: _buildRightPanel(t)),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildLeftPanel(t),
                        const SizedBox(height: 40),
                        _buildRightPanel(t),
                      ],
                    ),
            ],
          ),
        ),
      ),
    );
  }

  // Left Content: Title, localized description, toggle switch, CTAs
  Widget _buildLeftPanel(Map<String, String> t) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Sparkle Eyebrow Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDFA), // teal-50
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.teal.shade200),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.auto_awesome, size: 14, color: Color(0xFF0F766E)),
              const SizedBox(width: 6),
              Text(
                t['eyebrow']!,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF0F766E)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Title
        Text(
          t['title']!,
          style: const TextStyle(
            fontFamily: 'Outfit',
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF0F172A),
            height: 1.2,
          ),
        ),
        const SizedBox(height: 16),

        // Intro Text
        Text(
          t['intro']!,
          style: const TextStyle(fontSize: 14, color: Color(0xFF475569), height: 1.5),
        ),
        const SizedBox(height: 20),

        // Language toggle
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: TailwindColors.slate.shade100,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: TailwindColors.slate.shade200),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: Text(
                  t['languageLabel']!,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _language = 'en'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _language == 'en' ? const Color(0xFF0F172A) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'English',
                    style: TextStyle(
                      color: _language == 'en' ? Colors.white : TailwindColors.slate.shade600,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _language = 'ta'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _language == 'ta' ? const Color(0xFF0F172A) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'தமிழ்',
                    style: TextStyle(
                      color: _language == 'ta' ? Colors.white : TailwindColors.slate.shade600,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Mobile flow details card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.teal.shade400,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.phone_android, color: Color(0xFF0F172A), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      t['mobileTitle']!,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t['mobileText']!,
                      style: TextStyle(color: TailwindColors.slate.shade300, fontSize: 12, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Bullet points
        Column(
          children: _ownershipPoints.map((point) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.check_circle_outline, size: 16, color: Colors.teal),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _language == 'en' ? point['en']! : point['ta']!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // CTAs
        Row(
          children: [
            ElevatedButton(
              onPressed: () => context.push('/register'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.teal.shade700,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                elevation: 0,
              ),
              child: Row(
                children: [
                  Text(t['primaryCta']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(width: 6),
                  const Icon(Icons.arrow_forward, size: 14),
                ],
              ),
            ),
            const SizedBox(width: 10),
            OutlinedButton(
              onPressed: () => context.push('/employer/post-job'),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: TailwindColors.slate.shade200),
                foregroundColor: TailwindColors.slate.shade800,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              ),
              child: Text(t['secondaryCta']!, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ],
    );
  }

  // Right Content: Preview screens & Journey panels
  Widget _buildRightPanel(Map<String, String> t) {
    final isWide = MediaQuery.of(context).size.width > 600;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // App Frame preview
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: TailwindColors.slate.shade50,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: TailwindColors.slate.shade200),
          ),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: TailwindColors.slate.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'THENIJOBS APP',
                          style: TextStyle(color: Colors.teal, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          t['mobileTitle']!,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5), // emerald-50
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: const Color(0xFFD1FAE5)),
                      ),
                      child: const Text(
                        'Live',
                        style: TextStyle(color: Color(0xFF065F46), fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 24, color: Colors.white10),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        decoration: BoxDecoration(
                          color: TailwindColors.slate.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: TailwindColors.slate.shade200),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.search, size: 14, color: Colors.grey),
                            const SizedBox(width: 8),
                            Text(
                              _language == 'en' ? 'Search job, company or service' : 'Job, company, service தேடு',
                              style: TextStyle(color: TailwindColors.slate.shade500, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Journey articles
        isWide
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _journeys.map((j) => Expanded(child: _buildJourneyCard(j))).toList(),
              )
            : Column(
                children: _journeys.map((j) => _buildJourneyCard(j)).toList(),
              ),
        const SizedBox(height: 16),

        // Features grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isWide ? 3 : 1,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: isWide ? 1.0 : 3.0,
          ),
          itemCount: _featureCards.length,
          itemBuilder: (context, index) {
            final f = _featureCards[index];
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: TailwindColors.slate.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: f['bgColor'] as Color,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(f['icon'] as IconData, size: 16, color: f['color'] as Color),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _language == 'en' ? f['title'] as String : f['titleTa'] as String,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _language == 'en' ? f['text'] as String : f['textTa'] as String,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 10, color: TailwindColors.slate.shade500, height: 1.3),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  // Builder for Journey card
  Widget _buildJourneyCard(Map<String, dynamic> j) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12, right: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: (j['bgColor'] as Color).withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: (j['color'] as Color).withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: j['color'] as Color,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(j['icon'] as IconData, size: 18, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _language == 'en' ? j['role']! : j['roleTa']!,
                      style: const TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      _language == 'en' ? j['title']! : j['titleTa']!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Steps list inside card
          Column(
            children: (j['steps'] as List<Map<String, dynamic>>).map((step) {
              return Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(step['icon'] as IconData, size: 14, color: j['color'] as Color),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _language == 'en' ? step['label'] as String : step['labelTa'] as String,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),

          // Proof text
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: TailwindColors.slate.shade100),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle, size: 14, color: TailwindColors.emerald),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _language == 'en' ? j['proof']! : j['proofTa']!,
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

