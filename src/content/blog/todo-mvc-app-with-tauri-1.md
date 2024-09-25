---
title: 使用Tauri构建桌面端应用程序——以TodoMVC为例（上）
date: 2022-05-02 17:29:00
tags: [Rust,Tauri]
excerpt: rust太难学了？学习了rust不会实践？简单使用 Tauri 搭建经典实战项目TodoMVC 来做实践吧。你会发现rust真的很好玩，tauri也是非常的快，转变思维使用rust来写代码真的很爽。
---

Rust 学的一头雾水？错，是太难了根本学不会，直接上实践就完事了。就用学习一个框架最经典的实战项目 TodoMVC，我们实现一个 rust+sqlite 做后端 、react 做前端的~~跨平台~~桌面端 app

## 创建 Tauri 项目

虽然根据[官方文档](https://tauri.studio/docs/getting-started/beginning-tutorial#1-start-a-new-tauri-project)新建一个项目很简单。

不过我是用 pnpm 做包管理，pnpm 创建项目运行如下

```sh
pnpm create tauri-app
```

我们选择使用从`create-vite` 然后使用 react-ts 模板

![创建项目|1481x785](https://oss.enpitsulin.xyz/images/Snipaste_2022-05-02_17-35-03.png)

然后等待 cli 安装完依赖，用 VSCode 打开项目，这里建议你安装`rust-analyzer`不过我估计学习 rust 应该早都推荐安装了,然后我们的项目目录就如下

![目录|311x225](https://oss.enpitsulin.com/images/20220502174606.png)

存放前端项目内容的 src 和 rust 后端的 src-tauri，对于 web 界面的开发就很正常开发 react 一样，但是对于和编写 rust 后端就不同于 electron 了毕竟 rust 和 nodejs 完全不一样

## 构建页面

首先我们直接使用 TodoMVC 这个项目提供的 css，安装`todomvc-app-css`

```sh
pnpm add todomvc-app-css
```

然后在入口文件引入,并把原先引入的样式文件删掉

```tsx:src/main.tsx {diff}
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
+ import 'todomvc-app-css/index.css'
- import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

然后新建 components 目录并创建 TodoItem 组件

```tsx:src/components/TodoItem.tsx
function TodoItem() {
  return (
    <li>
      <div className="view">
        <input type="checkbox" className="toggle" autoFocus />
        <label>some todo item</label>
        <button className="destroy"></button>
      </div>
    </li>
  )
}
export default TodoItem
```

以及 TodoList 组件

```tsx:src/components/TodoList.tsx
import TodoItem from './TodoItem'
function TodoList() {
  return (
    <>
      <header className="header">
        <h1>todos</h1>
        <input type="text" className="new-todo" placeholder="What needs to be done?" />
      </header>
      <section className="main">
        <input type="checkbox" className="toggle-all" />
        <label htmlFor="togle-all"></label>
        <ul className="todo-list">
          <TodoItem />
        </ul>
      </section>
      <footer className="footer">
        <span className="todo-count">
          <strong>1</strong>
          {' '}
          items left
        </span>
        <ul className="filters">
          <li>
            <a>All</a>
          </li>
          <li>
            <a>Active</a>
          </li>
          <li>
            <a>Completed</a>
          </li>
        </ul>
      </footer>
    </>
  )
}
export default TodoList
```

然后在 App.tsx 中把原先模板中的代码删除然后引入 TodoList 并展示出来。

```tsx:src/App.tsx
import TodoList from './component/TodoList'

function App() {
  return (
    <div className="todoapp">
      <TodoList />
    </div>
  )
}

export default App
```

### 启动 Tauri

然后启动 tauri，就可以看到效果了

```sh
pnpm tauri dev
```

![效果|1002x789](https://images-enpitsulin.oss-cn-beijing.aliyuncs.com/images/20220502180609.png)

不过这部分仅仅只是显示简单的 html 结构以及相应的 css 样式没有任何功能

## 开发后端

实现 web 界面功能先放到一边，先来考虑下 rust 后端操作，先了解下 tauri 怎么通信的

根据[官方文档](https://tauri.studio/docs/guides/command)我们可以通过 TauriAPI 包或者设置`tauri.conf.json > build > withGlobalTauri`为 true 来将 invoke 挂载到 window.\_\_TAURI\_\_ 对象上，比较建议开启`withGlobalTauri`让一会的调试更简单，虽然 tauri 官方有 test 但是我觉得直接在控制台测试更简单

然后我们就可以使用 invoke 调用 rust 后端提供的方法了

> 以下的操作均为 `src-tauri/` 目录下

### 使用 sqlite

首先添加 [rusqlite](https://github.com/rusqlite/rusqlite) 依赖来获得操作 sqlite 的能力

```toml:Cargo.toml {diff}
[dependencies]
# ...
+ rusqlite = { version = "0.27.0", features = ["bundled"] }
```

### 对 sqlite 数据库的操作

参考 [rusqlite](https://github.com/rusqlite/rusqlite#readme)的用法，我们创建一个方法来创建数据库连接。

```rust
fn connect() -> Result<()>{
    let db_path = "db.sqlite";
    let db = Connection::open(&db_path)?;
    println!("{}", db.is_autocommit());
    Ok(())
}
```

然后我们可以实现更多的方法来对数据库增删改查，但写太多方法每次都要创建数据库连接然后断开，比较麻烦，于是我们可以实现一个结构体`TodoApp`来封装常用的方法

## 设计 TodoApp 类

### 设计表结构

首先我们设计一下数据库表结构

Todo 表比较简单的结构，建表语句：

```sql
CREATE TABLE IF NOT EXISTS Todo (
    id          varchar(64)     PRIMARY KEY,
    label       text            NOT NULL,
    done        numeric         DEFAULT 0,
    is_delete   numeric         DEFAULT 0
)
```

### todo 模块

然后我们新建一个`todo.rs`模块,同时建立一个 Todo 结构体作为数据库行的类型供未来使用，这里都用 pub 因为我们可能在 main 中使用的时候访问这些属性

```rust
pub struct Todo {
    pub id: String,
    pub label: String,
    pub done: bool,
    pub is_delete: bool,
}
```

以及 TodoApp 结构体，不过暂时未实现内部的方法

```rust
pub struct TodoApp {
    pub conn: Connection,
}
impl TodoApp {
    //To be implement
}
```

然后就是抽象 CURD 成几个成员方法，由于 rust 不存在 new 这个关键词 我们构造一个类对象一般约定存在一个`pub fn new()`来对相应的类进行构造，其实所谓的构造就是返回一个存在 impl 的结构体。

于是添加以下实现

```rust:src/todo.rs
impl TodoApp{
    pub fn new()->Result<TodoApp>{
        let db_path = "db.sqlite";
        let conn = Connection::open(db_path)?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Todo (
                id          varchar(64)     PRIMARY KEY,
                label       text            NOT NULL,
                done        numeric         DEFAULT 0,
                is_delete   numeric         DEFAULT 0
            )",
            [],
        )?;
        Ok(TodoApp { conn })
    }
}
```

使用`Result`枚举类型是因为`Connection::open`返回的也是`Result`，我们希望使用`?`通过错误传播来简化错误流程处理（虽然这个方法也没有 Err，所以就只是为了简化流程罢了）

然后我们就可以通过`TodoApp::new().unwrap()`来构造一个 TodoApp 类了，使用 unwrap()拆解枚举类型中的 Ok 即我们返回的 TodoApp

### 实现 TodoApp 各种方法

既然已经能够构造类了，那么我们希望能对 sqlite 进行 CURD 等操作，当然需要相应的方法，如 `get_todos`、`get_todo(id)`、`new_todo(todo)`、`update_todo(todo)`，没有删除的方法因为设计表就已经设计了 is_delete 字段，决定我们的删除还是软删除，硬删除暂时不(lān de)实现

#### 查询所有的 todo

使用到 `Connection.prepare()`方法，这个方法返回的`Statement`的几个方法`query_map`、`execute`等，可以接收参数然后将参数传递调用`prepare()`时的语句中进行查询并返回。

这里我们使用`query_map`方法来得到一个迭代器，通过遍历迭代器我们获得了`Vec<Todo>`就是 Todo 对象的数组然后将其通过`Result`枚举包装然后返回

注意带有泛型但泛型不受参数控制的方法如 line 6 这个`row.get`方法传入泛型参数是以`row.get::<I, T>()`方式调用的。

因为 sqlite 中没有 boolean 类型所以我们使用 numeric 通过 1 或 0 来标识 true 或 false，使用对于这两个字段都需要记得处理一下

```rust:src/todo.rs {diff}
impl TodoApp {
#   ...
    pub fn get_todos(&self) -> Result<Vec<Todo>> {
        let mut stmt = self.conn.prepare("SELECT * FROM Todo").unwrap();
        let todos_iter = stmt.query_map([], |row| {
            let done = row.get::<usize, i32>(2).unwrap() == 1;
            let is_delete = row.get::<usize, i32>(3).unwrap() == 1;

            Ok(Todo {
                id: row.get(0)?,
                label: row.get(1)?,
                done,
                is_delete,
            })
        })?;
        let mut todos: Vec<Todo> = Vec::new();

        for todo in todos_iter {
            todos.push(todo?);
        }

        Ok(todos)
    }
}
```

于是我们可以获得 Sqlite 中的数据了，但是仍然需要提供 command 来供前端调用，我们回到 main.ts，先引入模块并导入 Todo 和 TodoApp

```rust:src/main.rs {diff}
#![cfg_attr(
    all(not(debug_assertions), target_os = "w&mut &mut indows"),
    windows_subsystem = "windows"
)]
+ mod todo;
+ use todo::{Todo, TodoApp};

fn main() {
    tauri::Builder::default()
+        .invoke_handler(tauri::generate_handler![
+            get_todos,
+        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

+ #[tauri::command]
+ fn get_todos() -> Vec<Todo> {
+     todo!()
+ }
```

**封装 tauri 状态**

我们需要使用 rust 标准库中的 Mutex 互斥锁以及 tauri 的 state 来让我们封装的 TodoApp 对象能够跨进程调用，首先新建一个`AppState`结构体做状态管理。

然后通过`tauri::Builder`的`manage`方法来管理这个状态。然后我们就可以封装`command`来使用这个对象的的方法来获取数据了。

```rust:src/main.rs {diff}
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod todo;
use todo::{Todo, TodoApp};

+ struct AppState {
+     app: Mutex<TodoApp>,
+ }

fn main() {
+   let app = TodoApp::new().unwrap();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_todos,
        ])
+       .manage(AppState {
+           app: Mutex::from(app),
+       })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_todos() -> Vec<Todo> {
+    let app = state.app.lock().unwrap();
+    let todos = app.get_todos().unwrap();
+    todos
}
```

**返回数据序列化**

写好 command 之后发现注解这里报错了。

![Error|658x358](https://images-enpitsulin.oss-cn-beijing.aliyuncs.com/images/20220831103356.png)

这里是因为我们返回的`Vec<Todo>`不是可以序列化的类型不能通过指令返回到前端，回到 todo.rs，我们增加注解给结构体增加序列化的功能。

```rust:todo.rs {diff}
+ use serde::{Serialize};

+ #[derive(Serialize)]
pub struct Todo {
    pub id: String,
    pub label: String,
    pub done: bool,
    pub is_delete: bool,
}
```

然后我们在界面上右键检查打开控制台然后输入`await __TAURI__.invoke("get_todos")`应该就能看到返回的空数组了

![get_todos|789x797](https://images-enpitsulin.oss-cn-beijing.aliyuncs.com/images/20220502222623.png)

**invoke 参数反序列化**

其实需要序列化和反序列化的原因就和前后端分离的 web 应用一样，在传输层使用的是 json 格式，但应用需要真正的对象，所以需要通过注解给对象添加 Serialize 和 Deserialize 接口

同时 invoke 方法也是可以接受第二个参数作为对 commond 调用的参数的，但是参数也需要具备从 json 格式反序列化数据的能力，于是增加注解

```rust:todo.rs {diff}
- use serde::{Deserialize};
+ use serde::{Serialize, Deserialize};

- #[derive(Serialize)]
+ #[derive(Serialize, Deserialize)]
pub struct Todo {
    pub id: String,
    pub label: String,
    pub done: bool,
    pub is_delete: bool,
}
```

### 完善 CURD

除了使用`Connection::prepare`返回的`Statement`中的方法，我们也可以从`Connection`直接`execute`SQL 语句，比如这个新增 todo，从 invoke 中获取 todo 参数并反序列化成`Todo`对象，然后结构获得 id 和 label 然后传递给 SQL 语句的参数完成 INSERT

```rust
pub fn new_todo(&self, todo: Todo) -> bool {
    let Todo { id, label, .. } = todo;
    match self
        .conn
        .execute("INSERT INTO Todo (id, label) VALUES (?, ?)", [id, label])
    {
        Ok(insert) => {
            println!("{} row inserted", insert);
            true
        }
        Err(err) => {
            println!("some error: {}", err);
            false
        }
    }
}
```

同理还有`update_todo`、`get_todo`，这里就不多列代码了，就给一个函数签名吧, 这里返回值愿意通过 Result 封装或者不封装其实应该问题都不大，看个人喜好了。

```rust
pub fn update_todo(&self, todo: Todo) -> bool {
  // more code
}
pub fn get_todo(&self, id: String) -> Result<Todo> {
  // also more code
}
```

同理也需要增加相应的指令

```rust:main.rs
#[tauri::command]
fn new_todo(todo: Todo) -> bool {
    let app = TodoApp::new().unwrap();
    let result = app.new_todo(todo);
    app.conn.close();
    result
}

#[tauri::command]
fn update_todo(todo: Todo) -> bool {
    //to be implemented
}

#[tauri::command]
fn toggle_done(id: String) -> bool {
    //to be implemented
}
```

以及别忘了在 generate_handler 中增加

```rust:main.rs {diff}
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_todos,
+            new_todo,
+            toggle_done,
+            update_todo
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

至此我们就基本完成了 TodoMVC 的后端，接下来在下篇中使用 react + jotai + 一些包 来完成这个应用的前端以及与 rust 后端的通信~~这部分就很水了，基本就是基础的 react~~

## 下篇链接

[使用 Tauri 构建桌面端应用程序——以 TodoMVC 为例（下）](/blog/todo-mvc-app-with-tauri-1)
