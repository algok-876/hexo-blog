---
title: 源码共读，使用Symbol.Iterator实现BST的中序迭代器
date: 2024-01-06 17:13:48
tags:
---

## 前言

*   **本文参加了由**[公众号@若川视野](https://link.juejin.cn/?target=https%3A%2F%2Flxchuan12.gitee.io "https://lxchuan12.gitee.io") **发起的每周源码共读活动，**  [点击了解详情一起参与。](https://juejin.cn/post/7079706017579139102 "https://juejin.cn/post/7079706017579139102")
*   **这是源码共读的第33期，链接：[【若川视野 x 源码共读】第33期 | arrify 转数组 - 掘金 (juejin.cn)](https://juejin.cn/post/7100218384918249503)。**

最近看到若川大佬发起的源码共读活动，觉得很感兴趣，所以也参与了一下。选了一期最简单的先适应一下

个人感觉这种学习方法还是挺高效的，在看源码的过程中，可以清楚的看到知识点是如何应用在实际场景中的。陌生的知识点也可以通过问题驱动的方式去攻克。例如，本文将介绍的[arrify](https://github.com/sindresorhus/arrify)这个只有十几行代码的库中涉及到的遍历器，我原本对它比较陌生，但是由于想搞懂他的代码为什么要那样写，通过阅读其他的辅助资料，一步一步地揭开了谜底。

## arrify解析

由于代码不多，可以直接先把代码帖进来。这个函数的主要功能就是将传入的值或者对象数组化。

```javascript
export default function arrify(value) {
    if (value === null || value === undefined) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string') {
        return [value];
    }

    if (typeof value[Symbol.iterator] === 'function') {
        return [...value];
    }

    return [value];
}

```

代码逻辑比较简单，前三个if条件很好理解，就不多说了。重点是最后一个if判断

```javascript
typeof value[Symbol.iterator] === 'function'
```

这是在判断value这个对象的`Symbol.iterator`属性是否是一个`function`，那么问题来了

1.  这个`Symbol.iterator`属性是个什么东西？
2.  为什么要判断它是否存在并且类型必须是`function`类型呢？
3.  为什么一个对象如果存在这个属性并且是`function`类型，就可以使用扩展运算符直接将其扩展成一个数组呢？

围绕着这三个问题展开学习，就很清晰了。学习链接:[Iterator 和 for...of 循环 - ECMAScript 6入门](https://es6.ruanyifeng.com/#docs/iterator)

## 迭代器

迭代器（Iterator）是为数据结构提供统一的访问机制。任何数据结构只要部署 Iterator 接口，就可以完成遍历操作（即依次处理该数据结构的所有成员）。

Iterator的遍历过程如下：

1.  一个指针对象，指向当前数据结构的起始位置。也就是说，遍历器对象本质上，就是一个指针对象。
2.  第一次调用指针对象的`next`方法，可以将指针指向数据结构的第一个成员。
3.  第二次调用指针对象的`next`方法，指针就指向数据结构的第二个成员。
4.  不断调用指针对象的`next`方法，直到它指向数据结构的结束位置。

next方法返回的数据结构如下

```javascript
{
    // value表示当前成员的值
    value: xxx,
    // true表示已经遍历完成，false 示尚未遍历完成
    done: true or false
}
```

ES6 规定，默认的 Iterator 接口部署在数据结构的`Symbol.iterator`属性，或者说，一个数据结构只要具有`Symbol.iterator`属性，就可以认为是“可迭代的”。看个例子

```javascript
const array = [1, 2, 3]
// 获取array的默认遍历器
const arrayIterator = array[Symbol.iterator]()
// 手动调用next方法遍历数组
console.log(arrayIterator.next())
console.log(arrayIterator.next())
console.log(arrayIterator.next())
console.log(arrayIterator.next())

// 运行结果：
{ value: 1, done: false }
{ value: 2, done: false }
{ value: 3, done: false }
{ value: undefined, done: true }
```

其他内置的集合类型也都部署了默认的iterator接口，例如Map, Set

小结：至此前面提出的前两个问题就有答案了，`Symbol.iterator`是默认的遍历器接口，如果存在这个属性并且是`function`类型就表明这个数据结构是可遍历的。可遍历的数据结构转数组时就可以把里面的每一个成员都放入数组。

## for...of循环

for...of循环可以遍历一个可迭代对象，每次取得该对象中的一个元素。由于可迭代对象部署了 `Symbol.iterator`属性，for...of循环每次都会调用`Symbol.iterator`接口返回的next方法。`for...of`循环可以使用的范围包括数组、Set 和 Map 结构、某些类似数组的对象（比如`arguments`对象、DOM NodeList 对象）以及字符串。

除此之外，使用扩展运算符，也会调用`Symbol.iterator`获取元素，例如

```javascript
class RangeIterator {
    constructor(start, stop) {
        this.start = start
        this.stop = stop
    }

    [Symbol.iterator] () {
        return this
    }

    next () {
        if (this.start === this.stop) {
            return {
                value: undefined,
                done: true
            }
        }
        return {
            value: this.start++,
            done: false
        }
    }
}

console.log([...new RangeIterator(1, 10)])  // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

RangeIterator类的实例是一个生成`start..stop`之间数字的遍历器，使用扩展运算符就可以获取区间内的数字。
至此，之前的第三个问题也得到了答案，对于部署了`Symbol.iterator`接口的对象，可以通过扩展运算符直接展开

## 结合JS遍历器实现一个BST的中序迭代器

### BST二叉搜索树

了解数据结构的同学肯定对二叉搜索树不陌生，相对于静态查找，二叉搜索树是一种很高效的查找结构。回顾一下它的性质：

1.  对于任意节点，其左子树上的所有节点的值都小于该节点的值。
2.  对于任意节点，其右子树上的所有节点的值都大于该节点的值。
3.  左子树和右子树都必须是二叉搜索树。

### Leetcode [173. 二叉搜索树迭代器](https://leetcode.cn/problems/binary-search-tree-iterator/)

![image.png](./a5d25364713d41cd8d36729e19c0883b~tplv-k3u1fbpfcp-jj-mark-3024-0-0-0-q75.awebp.webp)

分析题目：
题目的核心就是想让我们实现一个next函数，每次调用next函数都会按照中序遍历序列返回下一个元素。那很显然我们要对这颗二叉搜索树进行中序遍历了，但是这里需要注意，不能使用递归的方式，因为题目中的next函数是每调用一次，指针就指向下一个节点。递归是无法暂停的。那就需要用迭代的方式来模拟递归。

具体的思路可以参考：[【负雪明烛】单调栈！迭代来自对递归的理解 - 二叉搜索树迭代器 - 力扣（LeetCode）](https://leetcode.cn/problems/binary-search-tree-iterator/solution/fu-xue-ming-zhu-dan-diao-zhan-die-dai-la-dkrm/)

我已使用TS实现了BST的数据结构，将在此基础上添加next函数，并结合遍历器来支持JS的语法特性

```typescript
class BinarySearchTree<T> {
  protected root: Node<T> | null;
  private stack: Node<T>[];
  constructor(list: T[], public compareFn = defaultCompare) {
    this.root = null;
    // 遍历初始节点序列，构造二叉搜索树
    list.forEach(item => {
      this.insert(item);
    });
    // 初始化栈
    this.stack = [];
    let node = (this.root as unknown) as (Node<T> | null);
    // 将最左的一条分支的节点加入栈中
    while (node !== null) {
      this.stack.push(node);
      node = node.left;
    }
  }
  // 部署默认的遍历器接口，支持for...of循环, 扩展运算符
  [Symbol.iterator]() {
    return this;
  }

  // 核心next方法
  next() {
    // 如果栈中无节点表示遍历结束
    if (this.stack.length === 0) {
      return {
        value: undefined,
        done: true
      };
    }
    
    // 弹出当前节点
    const curr = this.stack.pop();
    if (curr?.right) {
      let node = curr.right;
      while (node !== null) {
        this.stack.push(node);
        node = node.left as Node<T>;
      }
    }
    // 返回当前值
    return {
      value: curr?.key,
      done: false
    };
  }

  insert(key: T) {
    if (!this.root) {
      this.root = new Node(key);
    } else {
      this.insertNode(this.root, key);
    }
  }

  insertNode(node: Node<T>, key: T) {
    // 向二叉搜索树中插入一个节点，省略实现
  }
}

```

使用如下代码来测试一下这个迭代器是否生效

```typescript
const tree = new BinarySearchTree<number>([3, 4, 5, 6, 8, 3, 5, 9]);
console.log('展开结果：', [...tree]);
```

![image.png](c49d7cef25bb477b8738211ba36362ad~tplv-k3u1fbpfcp-jj-mark-3024-0-0-0-q75.awebp.webp)

从运行结果看到，我们确实得到了这颗BST的中序遍历序列（BST的中序序列是有序的）。可以直接通过调用next方法动态的获取下一个元素，可能更加直观.

```typescript
const tree = new BinarySearchTree<number>([3, 4, 5, 6, 8, 3, 5, 9]);

const element1 = tree.next();
const element2 = tree.next();
const element3 = tree.next();
const element4 = tree.next();

console.log('element1', element1);
console.log('element2', element2);
console.log('element3', element3);
console.log('element4', element4);

```

![image.png](748f171e95e24c1dae4b4085de18b000~tplv-k3u1fbpfcp-jj-mark-3024-0-0-0-q75.awebp.webp)

每调用一次next方法就会返回这颗BST的中序遍历序列下的下一个元素。这也符合Leetcode的题意，此外还结合了JS的遍历器来支持一些特殊语法。

## 总结

迭代器是一种统一的访问接口，使得不同的数据结构可以使用统一的方法处理。`Symbol.iterator`是默认的迭代器接口，拥有此接口的对象是可遍历的。调用这个方法就会返回一个带有next方法的对象，而每次调用next方法就可以逐个元素地遍历这个数据结构了。这种机制在自定义的数据结构中非常有用，通过二叉搜索树的迭代器这个例子也展示了这种机制的应用。
