---
title: 从TS类型体操入手，学习TS
date: 2024-01-06 16:52:11
tags: TypeScript
---

很早之前就在github上面看到了[type-challenges](https://github.com/type-challenges/type-challenges)这个项目，但一直没去刷，最近准备面试，刚好借此复习一下TS。它的中文名叫 **TypeScript 类型体操姿势合集**，就是像Leetcode那样会有一些题目，然后根据题目要求完成类型的编写并通过测试用例。本文通过一些比较easy的题目，先梳理一下TS中比较基础的类型运算。

## 1、实现 Pick
### 题目要求
原题链接：[00004-easy-pick](https://github.com/type-challenges/type-challenges/blob/main/questions/00004-easy-pick/README.zh-CN.md) 
，题目的要求是：不使用 `Pick<T, K>` ，实现 TS 内置的 `Pick<T, K>` 的功能，**从类型 `T` 中选出符合 `K` 的属性，构造一个新的类型**，T是一个对象类型，K是一个联合类型
```typescript
interface Todo {
  title: string
  description: string
  completed: boolean
}

type TodoPreview = MyPick<Todo, 'title' | 'completed'>

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
}
```

### 大致思路 🤔
如果从js的角度看的话，不就是给你一组key，然后去指定的对象上选取包含在这组key中的属性嘛。那我们只要循环这组key，然后挨个去取对象上对应的属性不就行了嘛，这道题的类型运算也差不多是这样的思路。
#### in 操作符 ⚔️
TypeScript 语言的类型运算中，`in`运算符有不同的用法，用来取出（遍历）联合类型的每一个成员类型。举个例子
```typescript
type U = 'a'|'b'|'c';

type Foo = {
  [Prop in U]: number;
};
// 等同于
type Foo = {
  a: number,
  b: number,
  c: number
};
```
其实就可以认为是一种循环，循环遍历联合类型`U`。

#### keyof 操作符 ⚔️
keyof 是一个单目运算符，用于将对象类型的键组合成一个联合类型。
```typescript
interface T {
  0: boolean;
  a: string;
  b(): void;
}

type KeyT = keyof T; // 0 | 'a' | 'b'
```
#### 方括号运算符 ⚔️
方括号运算符（`[]`）用于取出对象的键值类型，比如`T[K]`会返回对象`T`的属性`K`的类型。

```typescript
type Person = {
  age: number;
  name: string;
  alive: boolean;
};

// Age 的类型是 number
type Age = Person['age'];
```
不要把这个方括号里的`age`理解成字符串，`age`是一个值类型，它是一个类型！！！把他换成一个类型别名也是可以的

```typescript
type Person = {
  age: number;
  name: string;
  alive: boolean;
};
type key = 'age'
// Age 的类型是 number
type Age = Person[key];
```
> 这一点可以很好的理解这道题目的代码

### 答案 📄
答案已经呼之欲出了，用`in`操作符遍历第二个参数`K`，然后使用方括号取到对应属性的类型
```typescript
type MyPick<T, K extends keyof T> = {
  [key in K]: T[key]
}
```
`keyof T`将`T`中的所有键转换成一个联合类型，`extends`用来约束K必须是`keyof T`的子集。这样做的目的是确保`K`中的每个分量在`T`中都存在对应的键。

搞定，下一题😎

## 2、对象属性只读
篇幅原因就不描述题目要求了，可以直接查看原题链接：[00007-easy-readonly](https://github.com/type-challenges/type-challenges/blob/main/questions/00007-easy-readonly/README.zh-CN.md)

### 大致思路 🤔
和上一道题做法差不多，不同的是新返回的对象和原来的在结构上是一模一样的，而且每个属性都变成了只读的。

#### readonly
`readonly`可以防止对象的属性被更改
```typescript
type Person = {
  readonly age: number;
  name: string;
  alive: boolean;
};
const person: Person = {
    age: 18,
    name: 'jack',
    alive: true
}

// 报错 Cannot assign to 'age' because it is a read-only property.
person.age = 99
```


### 答案 📄
```typescript
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}
```
就是给每个属性加上`readonly`修饰

> 可以思考一下，为什么这里没有出现`K extends keyof T`呢。答案很简单，因为这里的`K`就是从`T`中取出来的不需要额外约束TS就知道`T[K]`是合法的。前面一道题必须要约束一下，否则`K`不能用于`in`操作符，`key`也不能作为`T`的索引。

## 3、元组转换为对象
原题链接：[00011-easy-tuple-to-object](https://github.com/type-challenges/type-challenges/blob/main/questions/00011-easy-tuple-to-object/README.zh-CN.md)，这道题就开始有点意思了。要先了解一下元组这个类型和方括号运算符的高级用法

#### 元组 ⚔️
元组类型是另一种类型 `Array` 类型，它确切地知道它包含多少元素，以及它在特定位置包含哪些类型。这一点和数组很不一样，数组的长度是未知的，而且并不能够知道每个索引位置的类型。

```typescirpt
type tuple = [string, number, boolean]
const tup: tuple = ['1', 1, true]

// 报错 Type 'number' is not assignable to type 'string'
const tup2: tuple = [1, 1, true]
```
tup2中的元素的类型并没有和tuple类型中一一对应，除此之外元素个数也要相等才能赋值。从对象的角度来看元组这个东西，其实就有点像一个**键为数字的对象**。
```typescript
type tuple = {
    0: string,
    1: number,
    2: boolean
}
const tup: tuple = ['1', 1, true]
```
这是可行的，和元组表达的意思也是一致的，第一个位置的元素类型为`stirng`，第二个位置的元素类型为`number`，第三个位置的元素类型为`boolean`。

#### 方括号运算符 ⚔️
前面提到的方括号运算符里面可以是对象的某个键名（其实也是一个值类型），但也可以是一个索引类型，这样的话最终返回的结果就不是单个类型了，而是该索引类型（就是键的类型）对应的所有的元素的类型组合而成的联合类型。

```typescript
示例1：
interface Test {
    [p: string]: number
}
// number
type stringTypes = Test[string]

示例2：
type tuple = ['1', 1, true]
// true | "1" | 1
type allTypes = tuple[number]
```
第一个示例中的最终取得的类型是`number`，因为含有string类型的索引签名对应的属性类型就是number。

第二个示例中会得到元组中所有元素的类型组成的联合类型，因为其实元组的索引都是number类型的，所以可以一次全部取到所有元素的类型。

### 答案 📄
前面铺垫了那么多就是为了解这道题目的，先给出答案。
```typescript
type TupleToObject<T extends readonly any[]> = {
  [P in T[number]]: P
}
```
 ### 解析
 - `in`操作符就不用讲了吧
 - `T[number]`的作用就是获取元组所有元素对应的类型，返回一个联合类型，那这刚好不就可以用in来遍历嘛，然后每遍历到的一个类型同时作为键和值即可。


## 4、实现 Exclude

原题链接：[00043-easy-exclude](https://tsch.js.org/43/zh-CN)，这道题看似有点摸不着头脑，但是掌握相关知识点就会变得很简单。
### 大致思路 🤔
这道题给我们两个联合类型`T`和`U`（可以把联合类型看成是一个类型集合），求存在`T`中而不存在于`U`中的类型，从集合的角度来讲就是`T - U`，求差集。要求差集，先解决两个问题：1、如何判断T中的某个类型是否存在于U中。2、如何去除T中存在于U中的类型。

#### 条件类型 ⚔️
条件类型可以根据类型输入来判断返回何种类型
```typescript
示例1：
// 报错 Type '"message"' cannot be used to index type 'T'.
type MessageOf<T> = T["message"];
// 正确的做法，extends约束了T必须有一个message的属性
type MessageOf<T extends { message: unknown }> = T["message"];

示例2：
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;
```
示例2，泛型`T`就是输入类型，先判断`T`是否满足`{ message: unknown }`的约束，如果T存在`message`属性，就返回`message`属性的类型，否则返回`never`。

如果T是一个联合类型，就会出现分布式条件的情况

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;
type StrArrOrNumArr = ToArray<string | number>;  // string[] | number[]

// 等价于
type StrArrOrNumArr = (string extends any ? string[] : never)
| (number extends any ? number[] : never)
```
这两种情况是等价的，也就是说分布式条件会对联合类型中的每个类型都判断一次，并且运算的结果也是联合类型。**那么我们可以利用这一点来判断T中的类型是否存在于U中，即T中的每个类型是否满足U的约束。**

### 答案 📄
```typescript
type MyExclude<T, U> = T extends U ? never : T
```
当`T`中的类型存在于`U`中时，就返回`never`是为了剔除掉这个类型。举个例子再结合上面所讲的条件类型，应该会比较清晰了。
```typescript
type excludeNever = string | never | number  // string | number
```
可以看到最终生成的联合类型是没有`never`的。

现在假设`T='a' | 'b' | 'c'`，`U='a'`，那么答案给出的代码就等价于
```
('a' extends 'a' ? never : 'a')
| ('b' extends 'a' ? never : 'b')
| ('c' extends 'a' ? never : 'c')

never | 'b' | 'c' => 'b' | 'c'
```
这样不就求出了`T-U`嘛。

## 总结
通过一些简单的类型题目，复习了一遍TS中基础的类型运算，刚开始做这些题目的时候还是有点吃力的，因为对这些东西并不熟悉，甚至有些点根本就不知道。要把TS学好，还是得多练啊。

文章中如果有不准确，或者错误的地方。大家可以在评论区勘误一下，thank you!🤞
