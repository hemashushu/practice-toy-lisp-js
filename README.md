# (Practice) Toy LISP - JS

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [(Practice) Toy LISP - JS](#practice-toy-lisp-js)
  - [单元测试](#单元测试)
  - [程序示例](#程序示例)
    - [一般函数的调用](#一般函数的调用)
    - [匿名函数](#匿名函数)
    - [带尾部调用优化的函数调用](#带尾部调用优化的函数调用)
  - [语法](#语法)

<!-- /code_chunk_output -->

练习单纯使用 JS 编写简单的 _玩具 LISP_ 解析器。

> 注：本项目是阅读和学习《Building an Interpreter from scratch》时的随手练习，并无实际用途。程序的原理、讲解和代码的原始出处请移步 http://dmitrysoshnikov.com/courses/essentials-of-interpretation/ （这个教程的作者非常用心，有能力的请多多支持作者）

## 单元测试

```bash
$ npm test
```

或者

```bash
$ node test/test.js
```

## 程序示例

程序的运行方法可以参考测试文件 `test/test-evaluator.js`。

### 一般函数的调用

计算斐波那契数：

```clojure
(defn fib (i)
    (if (native.i64.eq i 1)
        1
        (if (native.i64.eq i 2)
            2
            (native.i64.add (fib (native.i64.sub i 1)) (fib (native.i64.sub i 2)))
        )
    )
)
(fib 8)
```

### 匿名函数

```clojure
(defn accumulate (count)
    (do
        (let internalLoop
            (fn (i result)
                (if (native.i64.eq i 0)
                    result
                    (internalLoop (native.i64.sub i 1) (native.i64.add i result))
                )
            )
        )
        (internalLoop count 0)
    )
)
(accumulate 100)
```

### 带尾部调用优化的函数调用

```clojure
(defnr sumToOneHundred (i accu)
    (if (native.i64.gt_s i 100)
        (break accu)
        (do
            (let next (native.i64.add i 1))
            (let sum (native.i64.add accu i))
            (recur next sum)
        )
    )
)
(sumToOneHundred 1 0)
```

## 语法

::TODO