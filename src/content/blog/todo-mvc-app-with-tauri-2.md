---
title: 使用Tauri构建桌面端应用程序——以TodoMVC为例（下）
date: 2022-05-02 17:32:00
tags: [Rust,Tauri]
excerpt: 上篇我们完成了基于sqlite数据库+rust的后端逻辑，但是仅仅有后端逻辑肯定不够，那么还需要完善前端，那么我们再简单的基于jotai状态管理来管理应用内的数据以及完善相应的调用rust后端的逻辑。
---

## 使用 jotai 控制应用状态

[jotai](https://github.com/pmndrs/jotai) 是一个原子状态管理工具，名字其实就是日语的`状態`的罗马音，api 非常简洁，我们的前端项目就使用这个库来做状态管理。

### 前端项目中用到的类型声明

这里还有一个需要用的到就是我们 Todo 的类型，其实就是将 rust 之前写好的 struct 用 ts interface 的方式声明一下以便前端项目使用。

```ts:src/types/todo.ts
export interface Todo {
  id: string
  label: string
  done: boolean
  is_delete: boolean
}
```

这里其实有一个[rust 包](https://github.com/Aleph-Alpha/ts-rs)能够在编译的自动生成 ts 类型绑定，但是我们的项目不大直接自己写也没啥问题。

### 定义原子

首先先在 src 下建立一个 store 目录，添加一个 todo.ts 文件来存放声明的一些原子。

```ts:src/store/todo.ts
import { atom } from 'jotai'
import { Todo } from '../types/todo'

/** 用于过滤完成状态 */
export const filterType = atom<'all' | 'completed' | 'active'>('all')

/** 包括is_delete 为true的todos */
export const allTodosAtom = atom<Todo[]>([])

/** 未被软删除的todos */
export const todosAtom = atom<Todo[]>((get) => {
  const todos = get(allTodosAtom)
  return todos.filter(todo => !todo.is_delete)
})

/** 经过过滤的todos */
export const filterAtom = atom((get) => {
  const todos = get(todosAtom)
  return todos.filter((todo) => {
    if (get(filterType) === 'all')
      return true
    return todo.done === (get(filterType) === 'completed')
  })
})

/** 方便使用的统计未完成的todo数量的原子 */
export const activeTodoCountAtom = atom((get) => {
  const todos = get(todosAtom)
  return todos.filter(todo => !todo.done).length
})

/** 也是方便实用的检查是否有todo完成的原子 */
export const anyTodosDone = atom((get) => {
  const todos = get(todosAtom)
  return todos.some(todo => todo.done)
})
```

虽然可能在后端查询表的时候直接将软删除的过滤掉更好但是因为我们的数据量应该不会很大而且我懒，所以直接`SELECT * from Todo`然后把所有数据给前端来过滤，当然这种行为不推荐=。=

## 应用中使用原子

然后我们定义好了原子自然要使用的，需要在页面顶级组件 App.tsx 引入需要使用的原子，然后我们通过一个副作用使用`invoke`将原子赋值，并且将得到的 `Todo[]` 在 TodoList 组件中使用 TodoItem 渲染出来。

那么我们需要通过 props 传递这个数据，首先需要先去定义一下这两个组件的 props。首先是 TodoItem

```tsx:src/component/TodoItem.tsx
import { Todo } from './types/todo'
const TodoItem: React.FC<{ todo: Todo }> = ({ todo }) => {
  return (
    <li>
      <div className="view">
        <input type="checkbox" className="toggle" checked={todo.done} autoFocus />
        <label>{todo.label}</label>
        <button className="destroy"></button>
      </div>
    </li>
  )
}
export default TodoItem
```

以及 TodoList

```tsx:src/component/TodoList.tsx
import TodoItem from './TodoItem'
import { Todo } from './types/todo'
const TodoList: React.FC<{ todos: Todo[] }> = ({ todos }) => {
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
          {todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
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

然后我们在 App.tsx 中使用一个副作用将 invoke('get_todos')返回的数据赋值给 AllTodosAtom 原子并且将 filterAtom 相应的数据传递下去。然后我们查看应用现在应该是变成一个空的列表的情况

```tsx:src/App.tsx
import { invoke } from '@tauri-apps/api'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import TodoList from './component/TodoList'
import { allTodosAtom, filterAtom } from './store/todos'
import { Todo } from './types/todo'

function App() {
  const [, setAllTodos] = useAtom(allTodosAtom)
  const [todos] = useAtom(filterAtom)
  useEffect(() => {
    invoke<Todo[]>('get_todos').then((res) => {
      setAllTodos(res)
    })
  }, [])
  return (
    <div className="todoapp">
      <TodoList todos={todos} />
    </div>
  )
}

export default App
```

![preview|1002x789](https://oss.enpitsulin.xyz/images/20220503121658.png)

### 新增 Todo

新增一个 todo 明显需要通过调用后端的"new_todo"向数据库插入新纪录，同时我们也要操作原子往 allTodoAtom 中插入新增的数据

所以修改 TodoList 让其中的 input 标签起作用以及过滤用的 a 标签能够控制 filterTypeAtom

```tsx:src/component/TodoList.tsx
import { invoke } from '@tauri-apps/api'
import { useAtom } from 'jotai'
import { KeyboardEventHandler, useCallback, useState } from 'react'
import { v4 as randomUUID } from 'uuid'
import { activeTodoCountAtom, allTodosAtom, anyTodosDone, filterType } from '../store/todos'
import { Todo } from '../types/todo'
import TodoItem from './TodoItem'

const TodoList: React.FC<{ todos: Todo[] }> = ({ todos }) => {
  const [, setTodos] = useAtom(allTodosAtom)
  const [type, setType] = useAtom(filterType)
  const [activeCount] = useAtom(activeTodoCountAtom)
  const [anyDone] = useAtom(anyTodosDone)

  const [newTodo, setNewTodo] = useState('')

  const addTodo = async (label: string, id: string) => {
    invoke('new_todo', { todo: { id, label, done: false, is_delete: false } })
  }

  const onAddTodo = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (newTodo) {
          const id = randomUUID()
          addTodo(newTodo, id)
          setTodos((oldTodos) => {
            return [...oldTodos, { label: newTodo, id, done: false } as Todo]
          })
          setNewTodo('')
        }
      }
    },
    [newTodo]
  )

  const onClearComplete = () => {
    setTodos((oldTodos) => {
      return oldTodos.filter((todo) => {
        const isDone = todo.done
        if (isDone) {
          invoke('update_todo', {
            todo: { ...todo, is_delete: true }
          })
          return false
        }
        return true
      })
    })
  }
  return (
    <>
      <header className="header">
        <h1>todos</h1>
        <input
          type="text"
          className="new-todo"
          value={newTodo}
          onChange={(e) => {
            setNewTodo(e.target.value)
          }}
          onKeyPress={onAddTodo}
          placeholder="What needs to be done?"
        />
      </header>
      <section className="main">
        <input type="checkbox" className="toggle-all" />
        <label htmlFor="togle-all"></label>
        <ul className="todo-list">
          {todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </section>
      <footer className="footer">
        <span className="todo-count">
          <strong>{activeCount}</strong>
          {' '}
          items left
        </span>
        <ul className="filters">
          <li>
            <a onClick={() => setType('all')} className={type == 'all' ? 'selected' : ''}>
              All
            </a>
          </li>
          <li>
            <a onClick={() => setType('active')} className={type == 'active' ? 'selected' : ''}>
              Active
            </a>
          </li>
          <li>
            <a onClick={() => setType('completed')} className={type == 'completed' ? 'selected' : ''}>
              Completed
            </a>
          </li>
        </ul>
        {anyDone && (
          <button className="clear-completed" onClick={onClearComplete}>
            Clear completed
          </button>
        )}
      </footer>
    </>
  )
}
export default TodoList
```

然后测试下效果，我们会发现这里应用会重载一次，因为对/tauri-src/目录下的文件修改就会触发 tauri 的 HMR，我们向 sqlite 就是修改了 db.sqlite 文件所以触发了一次，如果修改路径可能也会导致打包分发的时候路径出点问题，这个问题不知道怎么解决，希望有人能评论指出。

![new todo|1002x789](https://oss.enpitsulin.xyz/images/20220503152844.png)

### 修改和完成和删除 Todo

这三个操作我们都放在 TodoItem 组件里，不过要注意的是对"toggle_done"和"update_todo"的操作一定要加上防抖，这点也和开发 web 应用一致，可能频繁触发的并调用副作用的事件防抖还是很必须的。

最终组件代码如下，我额外使用了 react-use 和 use-debounce 这两个包的一些 hook。~~本来是想自己写的，写了一个就摆了，useDoubleClick 可以看最后仓库代码~~

```tsx:src/component/TodoItem.tsx
import { invoke } from '@tauri-apps/api'
import { useAtom } from 'jotai'
import { ChangeEventHandler, KeyboardEventHandler, useCallback, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { useDebouncedCallback } from 'use-debounce'
import { useDoubleClick } from '../hooks/useDoubleClick'
import { allTodosAtom } from '../store/todos'
import { Todo } from '../types/todo'

const TodoItem: React.FC<{ todo: Todo }> = ({ todo }) => {
  const [, setTodos] = useAtom(allTodosAtom)
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const toggleDone = useDebouncedCallback(() => {
    invoke('toggle_done', { id: todo.id })
  }, 500)

  const setLabel = useDebouncedCallback((label: string) => {
    invoke('update_todo', {
      todo: { ...todo, label }
    })
  }, 500)

  const deleteTodo = useCallback(() => {
    invoke('update_todo', {
      todo: { ...todo, is_delete: true }
    })
  }, [todo])

  const onDelete = () => {
    setTodos((todos) => {
      return todos.filter((t) => {
        return t.id !== todo.id
      })
    })
    deleteTodo()
  }

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const label = e?.target.value
    setTodos((todos) => {
      return todos.map((t) => {
        if (t.id === todo.id) {
          setLabel(label)
          return { ...t, label }
        }
        return t
      })
    })
  }

  useClickAway(ref, () => {
    finishEditing()
  })

  const finishEditing = useCallback(() => {
    setEditing(false)
  }, [todo])

  const handleViewClick = useDoubleClick(null, () => {
    setEditing(true)
  })

  const onDone = useCallback(() => {
    setTodos((todos) => {
      return todos.map((t) => {
        if (t.id === todo.id) {
          toggleDone()
          return { ...t, done: !t.done }
        }
        return t
      })
    })
  }, [todo.id])

  const onEnter = useCallback<KeyboardEventHandler<HTMLInputElement>>(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        finishEditing()
      }
    },
    [todo]
  )
  return (
    <li
      className={[editing && 'editing', todo.done && 'completed'].filter(Boolean).join(' ')}
      onClick={handleViewClick}
    >
      <div className="view">
        <input type="checkbox" className="toggle" checked={todo.done} onChange={onDone} autoFocus />
        <label>{todo.label}</label>
        <button className="destroy" onClick={onDelete}></button>
      </div>
      {editing && (
        <input
          ref={ref}
          type="text"
          autoFocus={true}
          value={todo.label}
          onChange={onChange}
          className="edit"
          onKeyPress={onEnter}
        />
      )}
    </li>
  )
}
export default TodoItem
```

## 打包和分发

我们只需要执行`pnpm tarui build`然后就可以在`tauri-src/target/release/bundle/msi`里找到 window 平台 的安装包了，想要自定义安装程序可以[参考](https://tauri.studio/docs/distribution/windows#customizing-the-windows-installer)，至于 MacOS 和 linux 我也没尝试过~~所以鸽了~~理论上应该是可以跨平台运行的，但是不太清楚具体操作\_(:3」∠)\_

## 关于学习 rust 的讨论

其实一直有种风气说学习 rust 卷，确实单纯来说一个做业务的前端学习 rust 是属于卷了，但是单纯的个人喜好来学习一门新兴语言，业余时间学习学习真的不仅能开拓眼界，同时增加一些经验，肯定是好处大大滴。

而且 rust 作为一款只要能搞定编译器就能安全运行的语言，比起日常接触的 js/ts 写起来有可能还要和虚无缥缈的类型系统打架来说实在是爽多了（个人体验）。虽然可能看着语法真的特别变扭，其实核心的思想还是一致的。

而且 rust 在前端基建方面的成果斐然还有 WSAM 方面也是头号种子选手的，万一以后前端不得不学 rust 那不是迟了？不如现在先卷别人一步！

## 参考资料

- [tarui](https://tauri.studio/) - 跨平台桌面程序开发框架，瘦身版的 electron
- [TodoMVC](https://todomvc.com/) - 经典的 web 框架开发实例
- [rusqlite](https://github.com/rusqlite/rusqlite) - sqlite with rust
- [jotai](https://github.com/pmndrs/jotai) - React 的一款 api 简洁用法灵活的状态管理工具
