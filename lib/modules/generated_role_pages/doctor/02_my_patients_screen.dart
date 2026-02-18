import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/localization/app_localization.dart';
import '../../../core/theme/color_scheme.dart';

class MyPatientsScreen extends ConsumerStatefulWidget {
  const MyPatientsScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<MyPatientsScreen> createState() => _MyPatientsScreenState();
}

class _MyPatientsScreenState extends ConsumerState<MyPatientsScreen> {
  final List<Map<String, String>> patients = [
    {'id': '1', 'name': 'Ahmed Hassan', 'condition': 'Hypertension', 'lastVisit': '2024-02-10'},
    {'id': '2', 'name': 'Fatima Mohammed', 'condition': 'Diabetes', 'lastVisit': '2024-02-08'},
    {'id': '3', 'name': 'Samir Ali', 'condition': 'Asthma', 'lastVisit': '2024-02-05'},
  ];

  @override
  Widget build(BuildContext context) {
    final locale = AppLocalization.of(context);
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDarkMode ? AppColorScheme.darkBg : AppColorScheme.lightBg,
      appBar: AppBar(
        title: Text(locale.translate('my_patients')),
        backgroundColor: AppColorScheme.purplePrimary,
        foregroundColor: Colors.white,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: patients.length,
        itemBuilder: (context, index) {
          final patient = patients[index];
          return _buildPatientCard(patient, locale, context);
        },
      ),
    );
  }

  Widget _buildPatientCard(Map<String, String> patient, AppLocalization locale, BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: AppColorScheme.purplePrimary.withOpacity(0.2),
                  child: Text(
                    patient['name']![0],
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColorScheme.purplePrimary,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        patient['name']!,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        'Condition: ${patient['condition']}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Last Visit: ${patient['lastVisit']}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.assignment),
                    label: Text(locale.translate('view_file')),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.prescription),
                    label: Text(locale.translate('new_prescription')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColorScheme.purplePrimary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
