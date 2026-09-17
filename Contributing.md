# Subscription Appへのコントリビューション / Contributing to Subscription App

Subscription Appへのコントリビューションに興味を持っていただき、ありがとうございます。
バグ報告、機能提案、ドキュメント、コードなど、さまざまな形での参加を歓迎します。

Thank you for your interest in contributing to Subscription App.
We welcome many forms of participation, including bug reports, feature proposals, documentation, and code contributions.

---

## 行動規範 / Code of Conduct

すべてのやり取りでは、敬意を持って建設的に交流してください。
このプロジェクトへ参加することで、[Ahoshinetの行動規範](https://github.com/Ahoshinet/.github/blob/main/Code_of_Conduct.md)を遵守することに同意したものとみなされます。

Please communicate respectfully and constructively in all interactions.
By participating in this project, you agree to follow the [Ahoshinet Code of Conduct](https://github.com/Ahoshinet/.github/blob/main/Code_of_Conduct.md).

---

## コントリビューションの種類 / Types of Contributions

以下を含むコントリビューションを歓迎します。

We welcome contributions including:

- バグ報告 / Bug reports
- 機能提案 / Feature proposals
- ドキュメントの改善 / Documentation improvements
- バグ修正 / Bug fixes
- テストの追加・改善 / Test additions and improvements
- 新機能の実装 / New features
- パフォーマンス、アクセシビリティ、開発者体験の改善 / Performance, accessibility, and developer experience improvements

---

## はじめる前に / Before You Start

小規模なバグ修正やドキュメント改善は、そのままPull Requestを作成して構いません。

次のような大規模または根本的な変更を検討している場合は、実装を始める前にIssueで提案し、方向性と範囲について相談してください。

- 大規模なリファクタリングや書き換え
- 基本設計やアーキテクチャの変更
- 公開API、データ形式、互換性に影響する変更
- Framework、言語、主要Dependencyの置き換え
- 多数のComponentにまたがる変更
- 本来の目的と直接関係しない一括整形や自動生成による変更

Small bug fixes and documentation improvements may be submitted directly as Pull Requests.

Before starting work, please open an Issue for changes such as:

- Large-scale refactoring or rewriting
- Fundamental design or architectural changes
- Changes affecting public APIs, data formats, or compatibility
- Replacements of frameworks, languages, or major dependencies
- Changes spanning many components
- Broad formatting or generated changes unrelated to the primary purpose

技術的に妥当な変更であっても、プロジェクトの方向性、レビュー負担、長期的な保守性などの理由により受け入れられない場合があります。
事前相談は、最終的なマージを保証するものではありません。

Even technically sound changes may be declined because of project direction, review cost, compatibility, or long-term maintenance impact.
Prior discussion helps avoid unnecessary work, but does not guarantee that a resulting Pull Request will be merged.

---

## AIを活用したコントリビューション / AI-Assisted Contributions

Ahoshinetは、AIを活用した開発を歓迎します。
AIが一部または大部分を作成したPull Requestも、その他のコントリビューションと同じ基準で受け付け、内容に基づいて評価します。

Ahoshinet welcomes the use of AI-assisted development tools.
Pull Requests prepared partially or primarily with AI assistance are welcome and will be evaluated on the same basis as any other contribution.

作成方法にかかわらず、コントリビューションの責任は提出者にあります。
AIを利用した変更を提出する前に、次の事項を確認してください。

Regardless of how a contribution was created, the person submitting it remains responsible for the result.
Before submitting AI-assisted work, please ensure that you:

- 変更内容を理解し、目的と動作を説明できること / Understand the changes and can explain their purpose and behavior
- 正確性、安全性、関連性を確認していること / Review the output for correctness, security, and relevance
- 必要なテストとCheckを実行していること / Run the appropriate tests and checks
- 機密情報、専有情報、不適切にライセンスされた内容を含めないこと / Do not include confidential, proprietary, or improperly licensed material
- Reviewへの対応と必要な修正を行えること / Remain available to respond to review feedback and make revisions

確認されていない低品質な生成物、誤解を招く内容、無差別または大量の自動投稿は、詳細なReviewを行わずCloseする場合があります。
AIの使用自体を理由に不利に扱うことはありません。

Low-quality, unreviewed, misleading, indiscriminate, or mass-automated submissions may be closed without detailed review.
The use of AI itself will not count against a contribution.

---

## 開発フロー / Development Flow

### 1. ForkとClone / Fork and Clone

RepositoryをForkし、自分のForkをCloneしてください。

Fork the repository and clone your fork.

```bash
git clone https://github.com/<your-username>/subscription-app.git
cd subscription-app
git remote add upstream https://github.com/Ahoshinet/subscription-app.git
```

### 2. Branchを作成する / Create a Branch

変更内容が分かる名前のBranchを作成してください。

Create a branch with a descriptive name.

```bash
git checkout -b feature/your-feature-name
# または / or
git checkout -b fix/your-bug-fix
```

| 種類 / Type | プレフィックス / Prefix |
| --- | --- |
| 新機能 / Feature | `feature/` |
| バグ修正 / Bug fix | `fix/` |
| ドキュメント / Documentation | `docs/` |
| リファクタリング / Refactoring | `refactor/` |

### 3. 変更を作成する / Make Changes

- 既存のCode Styleと設計方針に従う / Follow the existing code style and design
- 必要なTestを追加または更新する / Add or update relevant tests
- 影響するDocumentationを更新する / Update affected documentation
- 変更範囲を目的に必要な範囲へ限定する / Keep the change focused on its stated purpose
- 無関係な変更を同じPull Requestに含めない / Avoid unrelated changes in the same Pull Request

### 4. Commit / Commit

Commit Messageには[Conventional Commits](https://www.conventionalcommits.org/)の形式を使用してください。

Use the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages.

```text
feat: add a new feature
fix: correct a bug
docs: update documentation
refactor: restructure code without changing behavior
test: add or update tests
chore: update build scripts or tooling
```

### 5. Pull Request / Pull Request

- `main` Branchに向けて作成する / Target the `main` branch
- 変更の目的、内容、検証方法を明記する / Describe the purpose, changes, and validation performed
- 関連するIssueがある場合はLinkする / Link related Issues when applicable
- 互換性への影響やBreaking Changeを明記する / Clearly identify compatibility impact or breaking changes
- Pull Request Templateがある場合は使用する / Use the Pull Request template when provided
- Review Commentに対応する / Respond to review comments

---

## Reviewと受け入れ / Review and Acceptance

コントリビューションは、品質、範囲、互換性、安全性、プロジェクトの方向性、長期的な保守性に基づいてReviewされます。
IssueやPull Requestの提出は、Review、採用、マージを保証するものではありません。

Contributions are reviewed according to quality, scope, compatibility, security, project direction, and long-term maintenance impact.
Submission of an Issue or Pull Request does not guarantee review, acceptance, or inclusion in the project.

---

## 質問・相談 / Questions

コントリビューションに関する質問は、このRepositoryのIssueを利用してください。
一般的なお問い合わせは、[contact@corp.daruks.com](mailto:contact@corp.daruks.com)までご連絡ください。

For contribution-related questions, use this repository's Issues.
For general inquiries, contact [contact@corp.daruks.com](mailto:contact@corp.daruks.com).

Security上の問題は公開Issueで報告せず、[Ahoshinet Security Policy](https://github.com/Ahoshinet/.github/blob/main/Security.md)に記載された手順に従ってください。

Do not report security vulnerabilities in public Issues.
Follow the reporting instructions in the [Ahoshinet Security Policy](https://github.com/Ahoshinet/.github/blob/main/Security.md).

---

## ライセンス / License

このプロジェクトは[BSD 2-Clause License](./LICENSE)の下で公開されています。
コントリビューションを行うことで、その内容がBSD 2-Clause Licenseの下で配布されることに同意したものとみなされます。

This project is licensed under the [BSD 2-Clause License](./LICENSE).
By contributing, you agree that your contributions will be licensed under the BSD 2-Clause License.
