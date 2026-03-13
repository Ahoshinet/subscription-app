# コントリビューションガイド / Contributing Guide

まず、コントリビューションに興味を持っていただきありがとうございます！  
どんな形のコントリビューションも大歓迎です。

Thank you for your interest in contributing!  
All types of contributions are welcome.

---

## 行動規範 / Code of Conduct

このプロジェクトは [行動規範 / Code of Conduct](./CODE_OF_CONDUCT.md) を定めています。参加にあたっては必ずお読みください。

This project has a [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating.

---

## コントリビューションの種類 / Types of Contributions

以下のコントリビューションを歓迎します。

We welcome the following types of contributions.

- バグ報告 / Bug reports
- 機能提案 / Feature requests
- ドキュメントの改善 / Documentation improvements
- バグ修正 / Bug fixes
- 新機能の実装 / New features

---

## はじめる前に / Before You Start

大きな変更を加える前に、まず Issue を作成して内容を相談してください。  
実装後に方向性が合わないと判断されると、PR がマージされない場合があります。

Before making significant changes, please open an Issue to discuss your idea first.  
PRs that are not aligned with the project direction may not be merged.

---

## 開発フロー / Development Flow

### 1. フォーク & クローン / Fork & Clone

```bash
git clone https://github.com/Ahoshinet/subscription-app.git
cd subscription-app
```

### 2. ブランチを作成 / Create a Branch

```bash
git checkout -b feature/your-feature-name
# または / or
git checkout -b fix/your-bug-fix
```

ブランチ命名規則 / Branch naming convention:

| 種類 / Type | プレフィックス / Prefix |
| ----------- | ----------------------- |
| 新機能 / Feature | `feature/` |
| バグ修正 / Bug fix | `fix/` |
| ドキュメント / Docs | `docs/` |
| リファクタリング / Refactor | `refactor/` |

### 3. 変更を加える / Make Changes

- コードスタイルに従ってください / Follow the code style
- テストを追加・更新してください / Add or update tests
- ドキュメントを更新してください（必要な場合）/ Update documentation if needed

### 4. コミット / Commit

コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従ってください。

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

```
feat: add new feature
fix: fix a bug
docs: update documentation
refactor: refactor code without changing behavior
test: add or update tests
chore: update build scripts or tooling
```

### 5. プルリクエスト / Pull Request

- `main` ブランチに向けて PR を作成してください
- PR テンプレートに沿って内容を記載してください
- レビューに対応してください

- Open a PR targeting the `main` branch
- Fill in the PR template
- Respond to review comments

---

## 質問・相談 / Questions

コントリビューションに関して不明な点があれば、気軽にご連絡ください。

If you have any questions about contributing, feel free to reach out.

| 方法 / Method | 連絡先 / Address |
| ------------- | ---------------- |
| メール / Email | [contact@daruks.com](mailto:contact@daruks.com) |
| Discord | [@darui3018823](https://discord.com/users/darui3018823) |

---

## ライセンス / License

このプロジェクトは [BSD 2-Clause License](./License) の下で公開されています。

コントリビューションを行うことで、あなたのコードが BSD 2-Clause License の下で配布されることに同意したものとみなします。

This project is licensed under the [BSD 2-Clause License](./License).

By contributing, you agree that your contributions will be licensed under the BSD 2-Clause License.
