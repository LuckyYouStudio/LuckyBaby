# 幸运宝贝 LuckyBaby

一家人一起记录的孕期 App。准妈妈记录产检、用药、生活，准爸爸参与，家人了解。

不做社区，不做电商，不做广告，不做诊断。

## 运行

```bash
npm install
npx expo start
```

按 `i` 打开 iOS 模拟器（Expo Go），按 `w` 在浏览器打开。引导页底部"先用示例家庭看看"可载入示例数据，家庭页可切换到准爸爸、家人视角。

## 文档

- [市场调研](docs/01-市场调研.md)
- [产品方案](docs/02-产品方案.md)
- [云同步数据模型（M1 草稿）](supabase/schema.sql)

## 技术栈

Expo SDK 57 · React Native · TypeScript · expo-router · AsyncStorage（本地优先）
