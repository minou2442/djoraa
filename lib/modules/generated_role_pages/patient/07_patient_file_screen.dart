import 'package:flutter/material.dart';

class PatientFileScreen extends StatelessWidget {
  const PatientFileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Medical File')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Personal Information
            Text(
              'Personal Information',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildInfoRow('Name:', 'Ahmed Mohammed'),
                    _buildInfoRow('Date of Birth:', 'Jan 15, 1990'),
                    _buildInfoRow('Blood Type:', 'O+'),
                    _buildInfoRow('Allergies:', 'Penicillin'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Medical History
            Text(
              'Medical History',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.history),
                title: const Text('Hypertension'),
                subtitle: const Text('Diagnosed: 2020'),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.history),
                title: const Text('Diabetes Type 2'),
                subtitle: const Text('Diagnosed: 2019'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
