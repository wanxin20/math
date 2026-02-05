# 双系统（论文评选 + 教改）后端方案说明

前端已按「系统」隔离：通过路由 `/paper/*` 与 `/reform/*` 进入不同系统，请求会带请求头 `X-System: paper` 或 `X-System: reform`，且登录态、localStorage 按系统前缀分离（`paper_token` / `reform_token` 等）。

后端只需保证**两套系统使用不同数据库**即可。推荐两种做法，二选一。

---

## 方案一：双实例 + 两库（推荐，零改代码）

**思路**：同一套后端代码，跑两个进程，各自连接不同数据库；前端通过不同 API 地址访问对应实例。

**步骤**：

1. **准备两个库**  
   - 在 MySQL 中建两个库，例如：`math_paper`、`math_reform`。  
   - 用现有的 `database.sql` 分别在两库中执行一遍（表结构一致）。

2. **两份环境配置**  
   - 复制 `.env` 为 `.env.paper`、`.env.reform`。  
   - 修改其中的 `DB_DATABASE`（以及如需不同端口时的 `PORT`）：
     - `.env.paper`: `DB_DATABASE=math_paper`，`PORT=3000`
     - `.env.reform`: `DB_DATABASE=math_reform`，`PORT=3001`

3. **启动两个进程**  
   - 开发：  
     - 终端 1: `cp .env.paper .env && npm run start:dev`  
     - 终端 2: `cp .env.reform .env && PORT=3001 npm run start:dev`  
   - 生产：用 pm2/systemd 等分别用 `.env.paper` / `.env.reform` 启动两个进程。

4. **前端 / Nginx 分流**  
   - 前端根据当前系统请求不同 API（例如 `VITE_API_BASE_URL` 在构建时或运行时按系统选 `/api/paper` 或 `/api/reform`）。  
   - 或在 Nginx 中：  
     - `location /api/paper/` → proxy_pass 到 3000  
     - `location /api/reform/` → proxy_pass 到 3001  
   - 前端请求时带上前缀（如 `baseURL = basePath === '/paper' ? '/api/paper/v1' : '/api/reform/v1'`），这样无需改后端代码。

**优点**：不改任何后端代码，部署简单，两套数据完全隔离。  
**缺点**：需要跑两个进程、两个库。

---

## 方案二：单实例多数据源（按请求头 X-System 切库）

**思路**：一个 Nest 进程，配置两个 TypeORM 数据源（paper / reform），根据请求头 `X-System: paper | reform` 在请求级别切换当前使用的数据源。

**要点**：

1. 使用 `@nestjs/typeorm` 的多数据源方式，或自定义 `REQUEST` 作用域的 DataSource 提供者。  
2. 在中间件/守卫中从 `req.headers['x-system']` 读取 `paper` 或 `reform`，写入请求作用域（如 `AsyncLocalStorage` 或 request-scoped provider）。  
3. 各模块的 Repository 不再从默认的 `TypeOrmModule.forRoot()` 注入，而是从「当前请求对应的 DataSource」获取，这样同一套 Service 代码会命中不同库。

**优点**：只跑一个进程，运维简单。  
**缺点**：需要改 `app.module`、各模块的注入方式，以及加中间件/守卫，代码改动较多。

---

## 建议

- 若希望**最简便、最不重复**：采用**方案一（双实例 + 两库）**，后端代码零修改，仅复制配置、建库、启动两份。  
- 若必须单进程、单端口：再考虑方案二，并在此基础上实现请求级数据源切换。

前端已发送 `X-System` 请求头，若后续采用方案二，可直接复用该头做切库依据。
