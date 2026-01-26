# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial CLI implementation with timer, project, task, and team commands
- OAuth 2.1 with PKCE authentication flow
- API key authentication for CI/CD environments
- Multiple output formats: human-readable tables, pipe-friendly TSV, JSON
- Configuration management via `~/.timesheet-cli/`
- Environment variable overrides with `TIMESHEET_` prefix

## [1.0.0] - 2025-01-05

### Added
- Timer commands: start, stop, pause, resume, status, update
- Project commands: list, show, create, update, delete
- Task commands: list, show, create, update, delete
- Team commands: list
- Authentication: OAuth 2.1 login, API key support, logout, status
- Configuration: show, set, reset
- Global options: --json, --no-color, --api-key, --verbose, --quiet
- Secure credential storage via keytar
- Spinner and progress indicators
- Exit codes for scripting
