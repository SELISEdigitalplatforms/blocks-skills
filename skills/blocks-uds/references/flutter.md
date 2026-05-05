# Flutter Reference

Flutter integration with the Blocks UDS API. Uses `http` package for REST and GraphQL calls, and Riverpod for state management.

## Directory Structure

```
lib/
├── services/
│   ├── uds_service.dart        # REST calls (schemas, file uploads, access policies)
│   └── graphql_service.dart    # GraphQL gateway queries/mutations
├── models/
│   └── uds_types.dart          # Types matching contracts.md
└── providers/
    └── uds_providers.dart      # Riverpod providers
```

## Types Layer

```dart
// lib/models/uds_types.dart

class SchemaDefinition {
  final String itemId;
  final String schemaName;
  final String collectionName;
  final int schemaType;     // 1=Entity, 2=Dto
  final int accessLevel;     // 0=Public, 1=User, 2=Custom
  final String projectKey;
  final List<SchemaField> fields;

  SchemaDefinition({
    required this.itemId,
    required this.schemaName,
    required this.collectionName,
    required this.schemaType,
    required this.accessLevel,
    required this.projectKey,
    required this.fields,
  });

  factory SchemaDefinition.fromJson(Map<String, dynamic> json) {
    return SchemaDefinition(
      itemId: json['itemId'] as String,
      schemaName: json['schemaName'] as String,
      collectionName: json['collectionName'] as String,
      schemaType: json['schemaType'] as int,
      accessLevel: json['accessLevel'] as int,
      projectKey: json['projectKey'] as String,
      fields: (json['fields'] as List)
          .map((f) => SchemaField.fromJson(f as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SchemaField {
  final String name;
  final String type;
  final bool isArray;

  SchemaField({
    required this.name,
    required this.type,
    required this.isArray,
  });

  factory SchemaField.fromJson(Map<String, dynamic> json) {
    return SchemaField(
      name: json['name'] as String,
      type: json['type'] as String,
      isArray: json['isArray'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'type': type,
    'isArray': isArray,
    'isPIIData': false,
    'isUniqueData': false,
    'description': '',
  };
}
```

> [!IMPORTANT]
> Use integer enums: `schemaType`, `accessLevel`, `operation`, `validationType` — not strings. `projectKey` in bodies: use the actual key string, NOT the project slug.

## Environment Config

```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String apiUrl = 'https://api.example.com';
  static const String projectKey = 'your_project_key';
  static const String projectSlug = 'your_project_slug';
}
```

## REST Service

```dart
// lib/services/uds_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class UdsService {
  final String baseUrl = ApiConfig.apiUrl;
  final String projectKey = ApiConfig.projectKey;
  final http.Client _client;

  UdsService({http.Client? client}) : _client = client ?? http.Client();

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'x-blocks-key': projectKey,
  };

  Future<Map<String, dynamic>> defineSchema({
    required String schemaName,
    required String collectionName,
    required List<SchemaField> fields,
    int schemaType = 1,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/uds/v1/schemas/define'),
      headers: _headers,
      body: jsonEncode({
        'schemaName': schemaName,
        'collectionName': collectionName,
        'schemaType': schemaType,
        'projectKey': projectKey,
        'fields': fields.map((f) => f.toJson()).toList(),
      }),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<void> reloadConfiguration() async {
    await _client.post(
      Uri.parse('$baseUrl/uds/v1/configurations/reload?projectKey=$projectKey'),
      headers: _headers,
    );
  }

  Future<Map<String, dynamic>> createAccessPolicy({
    required String policyName,
    required int operation,
    required String schemaId,
    required String roleSlug,
  }) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/uds/v1/data-access/policy/create'),
      headers: _headers,
      body: jsonEncode({
        'policyName': policyName,
        'policyType': 0,
        'operation': operation,
        'schemaId': schemaId,
        'projectKey': projectKey,
        'isAllowPolicy': true,
        'priority': 1,
        'ruleGroup': {
          'logicalOperator': 1,
          'rules': [
            {
              'leftSource': 1,
              'leftOperand': 'role',
              'operator': 0,
              'rightSource': 0,
              'rightOperand': roleSlug,
              'description': '$roleSlug role',
            }
          ],
          'nestedGroups': [],
        },
      }),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPreSignedUploadUrl(String fileName) async {
    final res = await _client.post(
      Uri.parse('$baseUrl/uds/v1/Files/GetPreSignedUrlForUpload'),
      headers: _headers,
      body: jsonEncode({'name': fileName, 'projectKey': projectKey}),
    );
    return jsonDecode(res.body) as Map<String, dynamic>;
  }
}
```

## GraphQL Service

```dart
// lib/services/graphql_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class GraphQLService {
  final String gatewayUrl = '${ApiConfig.apiUrl}/uds/v1/${ApiConfig.projectSlug}/gateway';
  final http.Client _client;

  GraphQLService({http.Client? client}) : _client = client ?? http.Client();

  Future<Map<String, dynamic>> query(String gql, {Map<String, dynamic>? variables}) async {
    final res = await _client.post(
      Uri.parse(gatewayUrl),
      headers: {
        'Content-Type': 'application/json',
        'x-blocks-key': ApiConfig.projectKey,
      },
      body: jsonEncode({'query': gql, 'variables': variables ?? {}}),
    );
    final json = jsonDecode(res.body) as Map<String, dynamic>;
    if (json['errors'] != null && (json['errors'] as List).isNotEmpty) {
      throw Exception(json['errors'][0]['message']);
    }
    return json['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> mutate(String gql, Map<String, dynamic> input) async {
    return query(gql, variables: {'input': input});
  }
}
```

## Riverpod Providers

```dart
// lib/providers/uds_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/uds_service.dart';
import '../services/graphql_service.dart';

final udsServiceProvider = Provider((ref) => UdsService());
final graphqlServiceProvider = Provider((ref) => GraphQLService());

final productsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final gql = ref.read(graphqlServiceProvider);
  final data = await gql.query('''
    query GetProducts(\$skip: Int, \$take: Int) {
      getProducts(skip: \$skip, take: \$take) {
        items { _id name price }
        totalCount
      }
    }
  ''', variables: {'skip': 0, 'take': 20});
  return (data['getProducts']['items'] as List).cast<Map<String, dynamic>>();
});
```

## Usage Example

```dart
// lib/screens/product_list_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/uds_providers.dart';

class ProductListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);

    return productsAsync.when(
      data: (products) => ListView.builder(
        itemCount: products.length,
        itemBuilder: (context, index) {
          final p = products[index];
          return ListTile(
            title: Text(p['name'] ?? ''),
            subtitle: Text('\$${p['price']}'),
          );
        },
      ),
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
    );
  }
}
```

## File Upload

```dart
import 'dart:io';
import 'package:http/http.dart' as http;

Future<String> uploadFile(String filePath) async {
  final file = File(filePath);
  final fileName = file.path.split('/').last;

  final urlData = await udsService.getPreSignedUploadUrl(fileName);
  final uploadUrl = urlData['uploadUrl'] as String;
  final fileId = urlData['fileId'] as String;

  await http.put(
    Uri.parse(uploadUrl),
    headers: {'Content-Type': 'application/octet-stream'},
    body: await file.readAsBytes(),
  );

  return fileId;
}
```

## Key Patterns

- Use `projectKey` string value in REST request bodies
- Call `reloadConfiguration()` after any schema or data source change
- GraphQL queries: `get{SchemaName}s` for lists, `get{SchemaName}` for single
- Access policies: integer enums for `operation`, `policyType`, `logicalOperator`
- `schemaType: 1` for Entity schemas

## pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  flutter_riverpod: ^2.4.0
```

## TODO Checklist

- [ ] Add `http` and `flutter_riverpod` to `pubspec.yaml`
- [ ] Create `lib/models/uds_types.dart` with exact field names
- [ ] Create `lib/services/uds_service.dart` with REST endpoints
- [ ] Create `lib/services/graphql_service.dart` for data CRUD
- [ ] Create `lib/providers/uds_providers.dart` with Riverpod
- [ ] Implement file upload with pre-signed URL pattern
- [ ] Call `reloadConfiguration()` after schema changes
- [ ] Test GraphQL queries via gateway endpoint
