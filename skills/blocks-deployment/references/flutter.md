# Flutter CI/CD Deployment

## Overview

Flutter projects can integrate with SELISE Blocks CloudBuild for automated builds and deployments. This guide covers Flutter-specific patterns.

## Deployment Flow

1. **Connect repo** — Use `setup-repository-flow` with `get-github-repos` to find the repo
2. **Configure settings** — Use `update-repo-settings` for hosting config
3. **Create webhook** — Use `create-github-webhook` for push-triggered builds
4. **Monitor** — Use `get-build` with polling

## Flutter Service

```dart
// lib/services/cloudbuild_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class CloudbuildService {
  static const String _baseUrl = 'https://api.seliseblocks.com/cloudbuild/v1';
  final String projectKey;

  CloudbuildService({required this.projectKey});

  Map<String, String> get _headers => {
        'x-blocks-key': projectKey,
        'Content-Type': 'application/json',
      };

  Future<CloudbuildResponse> triggerBuild({
    required String repoId,
    String? hostingProviderId,
    String? regionId,
    String? machineConfigId,
  }) async {
    final body = jsonEncode({
      'repoId': repoId,
      'projectKey': projectKey,
      if (hostingProviderId != null) 'hostingProviderId': hostingProviderId,
      if (regionId != null) 'regionId': regionId,
      if (machineConfigId != null) 'machineConfigId': machineConfigId,
    });

    final response = await http.post(
      Uri.parse('$_baseUrl/Build/run-build'),
      headers: _headers,
      body: body,
    );
    return CloudbuildResponse.fromJson(jsonDecode(response.body));
  }

  Future<CloudbuildResponse> getBuild(String buildId) async {
    final uri = Uri.parse('$_baseUrl/Build?buildId=$buildId&ProjectKey=$projectKey');
    final response = await http.get(uri, headers: _headers);
    return CloudbuildResponse.fromJson(jsonDecode(response.body));
  }

  Future<CloudbuildResponse> getRepos() async {
    final uri = Uri.parse('$_baseUrl/Build/repos?ProjectKey=$projectKey');
    final response = await http.get(uri, headers: _headers);
    return CloudbuildResponse.fromJson(jsonDecode(response.body));
  }

  Future<CloudbuildResponse> getGithubRepos({String? search, int page = 1, int pageSize = 30}) async {
    final params = {
      'ProjectKey': projectKey,
      'PageNumber': page.toString(),
      'PageSize': pageSize.toString(),
      if (search != null && search.isNotEmpty) 'Search': search,
    };
    final uri = Uri.parse('$_baseUrl/Github/repos').replace(queryParameters: params);
    final response = await http.get(uri, headers: _headers);
    return CloudbuildResponse.fromJson(jsonDecode(response.body));
  }

  Future<CloudbuildResponse> createWebhook() async {
    final uri = Uri.parse('$_baseUrl/Github/webhook?x-blocks-key=$projectKey');
    final response = await http.post(uri, headers: {'Content-Type': 'application/json'});
    return CloudbuildResponse.fromJson(jsonDecode(response.body));
  }
}

class CloudbuildResponse {
  final bool isSuccess;
  final Map<String, String> errors;
  final String? buildId;
  final dynamic data;

  CloudbuildResponse({
    required this.isSuccess,
    required this.errors,
    this.buildId,
    this.data,
  });

  factory CloudbuildResponse.fromJson(Map<String, dynamic> json) {
    return CloudbuildResponse(
      isSuccess: json['isSuccess'] ?? false,
      errors: (json['errors'] as Map<String, dynamic>?)?.map(
            (k, v) => MapEntry(k, v.toString()),
          ) ??
          {},
      buildId: json['buildId'],
      data: json['data'],
    );
  }

  String get errorMessage => errors.values.join(', ');
}
```

## Flutter BLoC

```dart
// lib/blocs/deployment_bloc.dart
import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../services/cloudbuild_service.dart';

abstract class DeploymentEvent {}

class TriggerBuild extends DeploymentEvent {
  final String repoId;
  TriggerBuild(this.repoId);
}

class PollBuildStatus extends DeploymentEvent {
  final String buildId;
  PollBuildStatus(this.buildId);
}

class StopPolling extends DeploymentEvent {}

abstract class DeploymentState {}

class DeploymentInitial extends DeploymentState {}

class DeploymentLoading extends DeploymentState {}

class BuildTriggered extends DeploymentState {
  final String buildId;
  BuildTriggered(this.buildId);
}

class BuildStatusUpdated extends DeploymentState {
  final String status;
  BuildStatusUpdated(this.status);
}

class DeploymentError extends DeploymentState {
  final String message;
  DeploymentError(this.message);
}

class DeploymentBloc extends Bloc<DeploymentEvent, DeploymentState> {
  final CloudbuildService _service;
  Timer? _pollingTimer;

  DeploymentBloc(this._service) : super(DeploymentInitial()) {
    on<TriggerBuild>(_onTriggerBuild);
    on<PollBuildStatus>(_onPollBuildStatus);
    on<StopPolling>(_onStopPolling);
  }

  Future<void> _onTriggerBuild(TriggerBuild event, Emitter<DeploymentState> emit) async {
    emit(DeploymentLoading());
    final response = await _service.triggerBuild(repoId: event.repoId);
    if (response.isSuccess && response.buildId != null) {
      emit(BuildTriggered(response.buildId!));
      add(PollBuildStatus(response.buildId!));
    } else {
      emit(DeploymentError(response.errorMessage));
    }
  }

  Future<void> _onPollBuildStatus(PollBuildStatus event, Emitter<DeploymentState> emit) async {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      final response = await _service.getBuild(event.buildId);
      final status = (response.data as Map<String, dynamic>?)?['build']?['status'] as String?;
      if (status == 'Succeeded' || status == 'Failed' || status == 'Cancelled') {
        add(StopPolling());
      }
      // ignore: invalid_use_of_visible_for_testing_member
      emit(BuildStatusUpdated(status ?? 'Unknown'));
    });
  }

  void _onStopPolling(StopPolling event, Emitter<DeploymentState> emit) {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  @override
  Future<void> close() {
    _pollingTimer?.cancel();
    return super.close();
  }
}
```

## Flutter UI

```dart
// lib/screens/deployment_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../blocs/deployment_bloc.dart';
import '../services/cloudbuild_service.dart';

class DeploymentScreen extends StatelessWidget {
  const DeploymentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => DeploymentBloc(
        CloudbuildService(projectKey: 'YOUR_PROJECT_KEY'),
      ),
      child: const DeploymentView(),
    );
  }
}

class DeploymentView extends StatelessWidget {
  const DeploymentView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Deploy App')),
      body: BlocBuilder<DeploymentBloc, DeploymentState>(
        builder: (context, state) {
          if (state is DeploymentLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is DeploymentError) {
            return Center(
              child: Text(state.message, style: const TextStyle(color: Colors.red)),
            );
          }
          if (state is BuildTriggered) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Build ID: ${state.buildId}'),
                  const SizedBox(height: 16),
                  if (state is BuildStatusUpdated)
                    _buildStatusChip(state.status),
                ],
              ),
            );
          }
          return Center(
            child: ElevatedButton(
              onPressed: () {
                context.read<DeploymentBloc>().add(TriggerBuild('repo-id-here'));
              },
              child: const Text('Trigger Build'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final colors = {
      'Queued': Colors.orange,
      'InProgress': Colors.blue,
      'Succeeded': Colors.green,
      'Failed': Colors.red,
      'Cancelled': Colors.grey,
    };
    return Chip(
      label: Text(status),
      backgroundColor: colors[status]?.withOpacity(0.2),
    );
  }
}
```

## Environment Configuration

```dart
// lib/config/env.dart
class Env {
  static const String apiUrl = String.fromEnvironment('BLOCKS_API_URL', defaultValue: 'https://api.seliseblocks.com');
  static const String projectKey = String.fromEnvironment('BLOCKS_PROJECT_KEY', defaultValue: '');
}
```

## pubspec.yaml dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  flutter_bloc: ^8.1.0
  equatable: ^2.0.5
```

## GitHub Actions (Flutter)

```yaml
# .github/workflows/deploy.yml
name: Deploy Flutter App
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
          channel: stable
      - run: flutter pub get
      - run: flutter build apk --debug
      - name: Trigger Blocks Build
        run: |
          curl -X POST "${{ vars.BLOCKS_API_URL }}/cloudbuild/v1/Build/run-build" \
            -H "x-blocks-key: ${{ vars.BLOCKS_PROJECT_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"repoId": "${{ vars.BLOCKS_REPO_ID }}", "projectKey": "${{ vars.BLOCKS_PROJECT_KEY }}"}'
```

## Framework Notes

- Use `dart:convert` + `package:http` for API calls — no dio needed
- For state management, BLoC is the recommended pattern for deployment state
- For iOS builds, CloudBuild typically handles the native build; the Flutter artifact is bundled
- Project key should be passed via environment variables or a config service
- Build polling uses `Timer.periodic` with 10-second intervals, stopped at terminal states
