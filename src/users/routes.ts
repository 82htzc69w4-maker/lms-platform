import { Hono } from 'hono';
import type { Env } from '../types';
import { kvGetJSON, kvPutJSON, kvListByPrefix } from '../lib/kv';
import type { User, Role } from '../auth/types';
import { hashPassword } from '../auth/crypto';
import type { LearnerProfile } from './types';

const users = new Hono<{ Bindings: Env }>();

const VALID_ROLES: Role[] = ['learner', 'instructor', 'admin', 'administrator'];

// GET /api/users
// Lists every registered user (without password hashes), including each
// learner's department for a quick glance in the admin table.
users.get('/', async (c) => {
  const list = await kvListByPrefix(c.env, 'auth:user:');
  const result: Array<{ username: string; name: string; role: Role; department?: string }> = [];

  for (const key of list.keys) {
    const user = await kvGetJSON<User>(c.env, key.name);
    if (!user) continue;

    let department: string | undefined;
    if (user.role === 'learner') {
      const profile = await kvGetJSON<LearnerProfile>(c.env, `learner:profile:${user.username}`);
      department = profile?.department;
    }

    result.push({ username: user.username, name: user.name, role: user.role, department });
  }

  return c.json({ users: result });
});

// POST /api/users
// Registers a new user account. If role is 'learner', also expects and
// stores the Identity + Assignment profile fields.
users.post('/', async (c) => {
  const body = await c.req.json<{
    username: string;
    password: string;
    role: Role;
    // Identity fields — used for every role now (learner or not)
    firstName?: string;
    surname?: string;
    // Learner-only Identity section
    email?: string;
    mobile?: string;
    idNumber?: string;
    currentOccupation?: string;
    futureOccupations?: string;
    // Learner-only Assignment section
    languagePreference?: string;
    department?: string;
  }>();

  const username = body.username?.trim();
  const password = body.password;
  const role = body.role;

  if (!username || !password || !role) {
    return c.json({ error: 'username, password, and role are required' }, 400);
  }

  if (!VALID_ROLES.includes(role)) {
    return c.json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` }, 400);
  }

  const existing = await kvGetJSON<User>(c.env, `auth:user:${username}`);
  if (existing) {
    return c.json({ error: `Username "${username}" is already taken` }, 409);
  }

  let displayName = '';

  if (role === 'learner') {
    const required = [
      body.firstName,
      body.surname,
      body.email,
      body.mobile,
      body.idNumber,
      body.currentOccupation,
      body.languagePreference,
      body.department,
    ];
    if (required.some((f) => !f || !f.trim())) {
      return c.json(
        {
          error:
            'For learners, firstName, surname, email, mobile, idNumber, currentOccupation, languagePreference, and department are all required',
        },
        400
      );
    }

    displayName = `${body.firstName} ${body.surname}`.trim();

    const profile: LearnerProfile = {
      username,
      firstName: body.firstName!.trim(),
      surname: body.surname!.trim(),
      email: body.email!.trim(),
      mobile: body.mobile!.trim(),
      idNumber: body.idNumber!.trim(),
      currentOccupation: body.currentOccupation!.trim(),
      futureOccupations: body.futureOccupations?.trim() ?? '',
      languagePreference: body.languagePreference!.trim(),
      department: body.department!.trim(),
    };
    await kvPutJSON(c.env, `learner:profile:${username}`, profile);
  } else {
    if (!body.firstName?.trim() || !body.surname?.trim()) {
      return c.json({ error: 'firstName and surname are required' }, 400);
    }
    displayName = `${body.firstName} ${body.surname}`.trim();
  }

  const passwordHash = await hashPassword(password);
  const user: User = { username, passwordHash, name: displayName, role };
  await kvPutJSON(c.env, `auth:user:${username}`, user);

  return c.json({ ok: true, user: { username, name: displayName, role } });
});

export default users;
