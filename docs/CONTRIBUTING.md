# Contributing Guide - TK88 Gaming Platform

## Code of Conduct

Be respectful, inclusive, and professional. This applies to all interactions.

---

## Getting Started

1. Read [SETUP.md](./SETUP.md) for development environment setup
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
3. Read [SECURITY.md](./SECURITY.md) for security guidelines
4. Read [API.md](./API.md) for API specifications

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Branch naming convention
feature/*          # New features
bugfix/*           # Bug fixes
refactor/*         # Refactoring
docs/*             # Documentation
chore/*            # Dependencies, CI/CD, etc
```

### 2. Make Changes

**Backend:**
```bash
cd backend
npm run lint       # Check code style
npm run format     # Auto-format code
npm run test       # Run tests
```

**Frontend:**
```bash
cd frontend
npm run lint       # Check code style
npm run type-check # Type checking
npm run test       # Run tests
```

### 3. Commit

**Commit Message Convention** (Conventional Commits):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build, dependencies, CI/CD

**Examples:**
```bash
git commit -m "feat(auth): add MFA support"
git commit -m "fix(game): prevent double-betting on race condition"
git commit -m "docs(api): update endpoint documentation"
git commit -m "refactor(wallet): simplify balance calculation"
```

### 4. Create Pull Request

- Describe what changed and why
- Link related issues (e.g., `Fixes #123`)
- Request reviewers
- Ensure CI/CD passes (all checks green)

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how to test these changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] No breaking changes
- [ ] Security implications reviewed
```

### 5. Code Review

**Review Checklist:**
- [ ] Code is readable and maintainable
- [ ] Tests cover new functionality
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Documentation is accurate
- [ ] Follows project conventions

---

## Code Style

### TypeScript

- Use explicit types (no `any`)
- Import order: external libs → relative imports
- Use `const` by default, `let` if needed, never `var`
- Use arrow functions
- Destructure when possible

```typescript
// ✅ Good
import express from 'express';
import { User } from '../types';

const getUser = async (id: string): Promise<User | null> => {
  const { id, email } = await db.query('...');
  return { id, email };
};

// ❌ Bad
var getUser = function(id) {
  return db.query('...').then(result => result);
};
```

### React Components

- Use functional components with hooks
- Colocate related code
- Use descriptive prop names
- Prop destructuring in parameters

```typescript
// ✅ Good
interface GameProps {
  gameId: string;
  onBetPlaced: (amount: number) => void;
}

const GameContainer: React.FC<GameProps> = ({ gameId, onBetPlaced }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

// ❌ Bad
const GameContainer = (props) => {
  return (
    <div>
      {props.gameId}
    </div>
  );
};
```

### SQL/Database

- Use parameterized queries (never string concatenation)
- Use meaningful table/column names
- Include indexes for frequently queried columns
- Document schema changes in migrations

```typescript
// ✅ Good
const user = await db.query(
  'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
  [email]
);

// ❌ Bad
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## Testing

### Coverage Requirements

- **Backend**: Aim for 80%+ coverage
- **Frontend**: Aim for 70%+ coverage
- **Critical paths** (auth, payments): 100% coverage

### Writing Tests

```typescript
// Backend (Jest)
describe('AuthService', () => {
  it('should hash password correctly', async () => {
    const password = 'test123';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    expect(() => verifyPassword('wrong', 'hash')).toThrow();
  });
});

// Frontend (Vitest)
describe('GameContainer', () => {
  it('renders game canvas', () => {
    render(<GameContainer gameId="tai-xiu" />);
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });

  it('emits placeBet on user interaction', async () => {
    const onBet = vi.fn();
    render(<GameContainer gameId="tai-xiu" onBetPlaced={onBet} />);
    
    await userEvent.click(screen.getByText('Place Bet'));
    expect(onBet).toHaveBeenCalled();
  });
});
```

---

## Documentation

- Add JSDoc comments for public functions/classes
- Update README.md for user-facing changes
- Update API.md for new endpoints
- Update ARCHITECTURE.md for architectural changes

```typescript
/**
 * Hash a password using bcrypt with 12 salt rounds
 * @param password - Plain text password
 * @returns Promise resolving to hashed password
 * @throws Error if hashing fails
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};
```

---

## Security Checklist

Before submitting, verify:
- [ ] No secrets in code (.env files, API keys)
- [ ] No SQL injection vulnerabilities (parameterized queries)
- [ ] No XSS vulnerabilities (proper escaping)
- [ ] Input validation present
- [ ] Authentication/authorization checked
- [ ] Sensitive data encrypted
- [ ] Error messages don't leak information
- [ ] Audit logging for sensitive actions
- [ ] Rate limiting considered

---

## Performance Considerations

- Use database indexing for large tables
- Implement caching where appropriate
- Avoid N+1 queries
- Optimize bundle size (frontend)
- Use pagination for large datasets

```typescript
// ❌ N+1 Problem
const users = await db.query('SELECT * FROM users');
for (const user of users) {
  user.games = await db.query('SELECT * FROM games WHERE user_id = $1', [user.id]);
}

// ✅ Solution with JOIN
const usersWithGames = await db.query(`
  SELECT u.*, g.*
  FROM users u
  LEFT JOIN games g ON u.id = g.user_id
`);
```

---

## Release Process

1. Update version in `package.json` (semantic versioning)
2. Update [CHANGELOG.md](./CHANGELOG.md)
3. Create tag: `git tag v1.2.3`
4. Push to main: `git push origin main && git push origin v1.2.3`
5. CI/CD automatically builds and deploys

---

## Getting Help

- **Questions**: Open a discussion in GitHub
- **Bugs**: Open an issue with reproduction steps
- **Architecture**: Discuss in #architecture channel
- **Security**: Email security@tk88.com (don't open public issues)

---

**Last Updated**: April 2026
