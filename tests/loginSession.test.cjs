const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
    const values = new Map();
    const window = new EventTarget();
    const localStorage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
    let nextId = 0;
    const axiosMock = { create: () => ({ interceptors: {
        request: { use() {} }, response: { use() {} },
    } }) };
    const cache = new Map();
    function load(relative) {
        const file = path.resolve(__dirname, relative);
        if (cache.has(file)) return cache.get(file);
        const module = { exports: {} };
        cache.set(file, module.exports);
        const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env',
            '({ VITE_BOOT_API_BASE_URL_U: "http://test/user", VITE_BOOT_API_BASE_URL_A: "http://test/admin" })');
        const compiled = ts.transpileModule(source, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        }).outputText;
        vm.runInNewContext(compiled, {
            module, exports: module.exports, localStorage, window, Event,
            require(name) {
                if (name === 'uuid') return { v4: () => `session-${++nextId}` };
                if (name === 'axios') return axiosMock;
                return load(path.relative(__dirname, path.resolve(path.dirname(file), name + '.ts')));
            },
        }, { filename: file });
        return module.exports;
    }
    return { localStorage, window, load, session: load('../src/auth/loginSession.ts') };
}

test('토큰 갱신 후에도 동일 로그인 세션의 응답 허용', () => {
    const env = setup();
    const api = env.load('../src/api/axios.ts');
    env.session.startLoginSession();
    api.saveTokens('access-a', 'refresh-a', 'user');
    const pendingSession = env.session.readLoginSession();
    api.saveTokens('access-b', 'refresh-b', 'user');
    assert.equal(env.session.readLoginSession(), pendingSession);
    assert.equal(env.session.isCurrentLoginSession(pendingSession), true);
});

test('로그아웃과 재로그인 시 이전 응답 차단', () => {
    const env = setup();
    const api = env.load('../src/api/axios.ts');
    env.session.startLoginSession();
    api.saveTokens('access-a', 'refresh-a', 'user');
    const pendingSession = env.session.readLoginSession();
    api.clearSession();
    assert.equal(env.session.isCurrentLoginSession(pendingSession), false);
    env.session.startLoginSession();
    api.saveTokens('access-c', 'refresh-c', 'user');
    assert.notEqual(env.session.readLoginSession(), pendingSession);
    assert.equal(env.session.isCurrentLoginSession(pendingSession), false);
});

test('기존 갱신 이벤트와 다른 탭 알림 유지 및 구독 해제', () => {
    const env = setup();
    const api = env.load('../src/api/axios.ts');
    let notifications = 0;
    const unsubscribe = env.session.subscribeLoginSession(() => notifications++);
    api.saveTokens('a', 'r', 'user');
    api.saveTokens('b', 'r2', 'user');
    env.window.dispatchEvent(new Event('storage'));
    api.clearSession();
    assert.equal(notifications, 4);
    unsubscribe();
    env.window.dispatchEvent(new Event('storage'));
    assert.equal(notifications, 4);
});

test('기존 로그인과 비로그인 상태의 세션 확인 거부', () => {
    const env = setup();
    assert.equal(env.session.isCurrentLoginSession(''), false);
    env.localStorage.setItem('token', 'legacy');
    assert.equal(env.session.readLoginSession(), '');
    assert.equal(env.session.isCurrentLoginSession(''), false);
});

test('새로고침 후 동일한 로그인 세션 복원', () => {
    const env = setup();
    env.session.startLoginSession();
    env.localStorage.setItem('token', 'access-a');
    const before = env.session.readLoginSession();
    const loaded = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, '../src/auth/loginSession.ts'), 'utf8');
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
        { exports: loaded.exports, localStorage: env.localStorage, window: env.window,
            require: () => ({ v4: () => { throw new Error('복원 시 새 세션을 생성하면 안 됩니다.'); } }) });
    assert.equal(loaded.exports.readLoginSession(), before);
});
