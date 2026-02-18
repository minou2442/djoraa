import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localization.dart';
import '../../../core/theme/color_scheme.dart';
import '../../../core/providers/patient_provider.dart';

class FindDoctorsScreen extends ConsumerStatefulWidget {
  const FindDoctorsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<FindDoctorsScreen> createState() => _FindDoctorsScreenState();
}

class _FindDoctorsScreenState extends ConsumerState<FindDoctorsScreen> {
  String? _selectedSpecialization;
  String? _searchQuery;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalization.of(context);
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDarkMode ? AppColorScheme.darkBg : AppColorScheme.lightBg,
      appBar: AppBar(
        title: Text(locale.translate('find_doctor')),
        backgroundColor: AppColorScheme.purplePrimary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Search Bar
          Container(
            decoration: BoxDecoration(
              color: AppColorScheme.purplePrimary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColorScheme.purplePrimary.withOpacity(0.3),
              ),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (value) {
                setState(() => _searchQuery = value);
              },
              decoration: InputDecoration(
                hintText: locale.translate('search_doctors'),
                prefixIcon: const Icon(Icons.search, color: AppColorScheme.purplePrimary),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Specialization Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('Cardiology', locale),
                _buildFilterChip('Pediatrics', locale),
                _buildFilterChip('Dermatology', locale),
                _buildFilterChip('Neurology', locale),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Doctors List
          ref.watch(searchDoctorsProvider({'specialization': _selectedSpecialization, 'location': null, 'minRating': null})).when(
            data: (doctors) {
              if (doctors.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        Icon(Icons.doctor_badge_outlined, size: 64, color: AppColorScheme.purplePrimary.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text(locale.translate('no_doctors_found')),
                      ],
                    ),
                  ),
                );
              }
              return ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: doctors.length,
                itemBuilder: (context, index) {
                  final doctor = doctors[index];
                  return _buildDoctorCard(doctor, locale, context);
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('Error: $error')),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, AppLocalization locale) {
    final isSelected = _selectedSpecialization == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (selected) {
          setState(() => _selectedSpecialization = selected ? label : null);
        },
        backgroundColor: Colors.transparent,
        selectedColor: AppColorScheme.purplePrimary.withOpacity(0.2),
        side: BorderSide(
          color: isSelected ? AppColorScheme.purplePrimary : Colors.grey,
        ),
      ),
    );
  }

  Widget _buildDoctorCard(dynamic doctor, AppLocalization locale, BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: AppColorScheme.purplePrimary.withOpacity(0.2),
              child: const Icon(Icons.person, color: AppColorScheme.purplePrimary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctor.fullName ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    doctor.specialization ?? 'Specialist',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star, size: 16, color: Colors.amber),
                      const SizedBox(width: 4),
                      Text('4.5 (120 reviews)', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColorScheme.purplePrimary,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: Text(locale.translate('book')),
            ),
          ],
        ),
      ),
    );
  }
}
