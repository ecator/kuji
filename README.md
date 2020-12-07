# kuji

简单的抽奖程序。词源来自日语**くじ**  :gift:

整个抽奖程序由一个内圆(r1)和围绕一圈的外圆(r2)组成，首先会滚动内圆，然后再滚动外圆，组合起来的一个`xx-yy`的数字就是最终的中奖号码。

# 开发

确保是最新的nodejs环境，然后运行下面命令安装依赖：

```
npm i
```

无论是开发还是最终使用，都需要把`config-sample`移动到`$HOME`路径下面并重命名为`kuji`。

> Windows到话应该是`%USERPROFILE%`路径，也就是自己的家目录。

在开发环境下直接启动的话用下面的命令：

```
npm start
```

如果要打包对应平台的环境可以用下面的命令：

```
# mac
npm run build-mac
# windows
npm run build-win
```

打包好后会在`dist`目录下生成对应的zip文件。

# 使用

## 配置

参考[开发](#开发)步骤，把`config-sample`移动到对应家目录下并改名为`kuji`即可，里面是对应的配置文件。

一般主要配置`include.txt`文件即可，用于自定义抽奖的号码。

## 启动

Windows的话解压后执行`kuji.exe`就可以了，mac的话直接运行解压后的`kuji.app`就可以了。



## 快捷键

- 空格<br>
开始抽奖，一共有4个状态，变化关系如下：<br>
[![](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggTFJcbiAgQVvliJ3lp4vnirbmgIFdXG4gIEJb5YaF5ZyGcjHmu5rliqhdXG4gIENb5aSW5ZyGcjLmu5rliqhdXG4gIERb5bGV56S657uT5p6cXVxuXG4gIEEtLT58c3BhY2V8QlxuICBCLS4tPnxhdXRvfENcbiAgQy0uLT58YXV0b3xEXG4gIEQtLT58c3BhY2V8QVxuXHRcdCIsIm1lcm1haWQiOnt9LCJ1cGRhdGVFZGl0b3IiOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/#/edit/eyJjb2RlIjoiZ3JhcGggTFJcbiAgQVvliJ3lp4vnirbmgIFdXG4gIEJb5YaF5ZyGcjHmu5rliqhdXG4gIENb5aSW5ZyGcjLmu5rliqhdXG4gIERb5bGV56S657uT5p6cXVxuXG4gIEEtLT58c3BhY2V8QlxuICBCLS4tPnxhdXRvfENcbiAgQy0uLT58YXV0b3xEXG4gIEQtLT58c3BhY2V8QVxuXHRcdCIsIm1lcm1haWQiOnt9LCJ1cGRhdGVFZGl0b3IiOmZhbHNlfQ)

- Ctrl+F12<br>
调出控制台，用于调试程序。

- Ctrl+F<br>
全屏和窗口模式之间切换

- 数字键`0-9`<br>
切换背景，默认是0号背景，可以自定义。

- Ctrl+S<br>
保存已经抽过的号码，会输出到配置路径下的`exclude.txt`文件里面，下次启动的时候会自动排除这个文件里面的号码。
