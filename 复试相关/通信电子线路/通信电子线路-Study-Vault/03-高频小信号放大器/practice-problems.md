# Chapter 3 Practice Problems

[[../00-overview/00-course-map|<- Back]] | [[core-concepts|Core Concepts ->]] | [[quick-ref|Quick Ref ->]]

---

## 概览
覆盖：增益/通频带/选择性指标、单/双调谐与耦合状态、稳定性、噪声系数与多级噪声。全部解答折叠，建议先独立完成。

> [!info] 题型提示
> - **带宽题**：先写 $2\Delta f_{0.7}=f_0/Q$ 或 3 dB 定义
> - **选择性题**：矩形系数与抑制比是高频考点
> - **噪声题**：优先用 Friis 公式

---

### Problem 1: 通频带计算
某单调谐放大器 $f_0=10\,\text{MHz}$，等效品质因数 $Q_L=50$。求 3 dB 通频带 $2\Delta f_{0.7}$。

> [!example]- Solution
> **Answer:** $2\Delta f_{0.7}=0.2\,\text{MHz}$。
>
> **Reasoning:**
> - $2\Delta f_{0.7}=f_0/Q_L=10/50=0.2\,\text{MHz}$。

### Problem 2: 矩形系数
若某放大器 $2\Delta f_{0.7}=8\,\text{kHz}$，$2\Delta f_{0.1}=20\,\text{kHz}$，求矩形系数 $K_{r0.1}$。

> [!example]- Solution
> **Answer:** $K_{r0.1}=2.5$。
>
> **Reasoning:**
> - $K_{r0.1}=2\Delta f_{0.1}/2\Delta f_{0.7}=20/8=2.5$。

### Problem 3: 抑制比
谐振点增益 $A_{u0}=200$，某干扰频率下增益 $A_u=2$。求抑制比及 dB 值。

> [!example]- Solution
> **Answer:** $d=100$，$d(\mathrm{dB})=40\,\text{dB}$。
>
> **Reasoning:**
> - $d=A_{u0}/A_u=200/2=100$。
> - $20\lg 100=40$。

### Problem 4: 耦合状态判断
观察频响为双峰且中心凹陷，属于哪种耦合状态？

> [!example]- Solution
> **Answer:** 过耦合。
>
> **Reasoning:**
> - 过耦合会出现双峰响应。

### Problem 5: 放大器选型
要求带宽较宽且频响较平坦，优先选单调谐还是双调谐放大器？

> [!example]- Solution
> **Answer:** 双调谐放大器。
>
> **Reasoning:**
> - 双调谐通过耦合调整可获得更宽带宽和较平坦频响。

### Problem 6: 稳定性措施
高增益多级放大器出现自激风险，给出两项常用稳定措施。

> [!example]- Solution
> **Answer:** 降低单级增益、加中和电路（或隔离/屏蔽/良好接地）。
>
> **Reasoning:**
> - 减小反馈与寄生耦合是稳定的核心思路。

### Problem 7: 噪声系数
若噪声系数 $F=2$，求噪声指数 $NF$。

> [!example]- Solution
> **Answer:** $NF=3.01\,\text{dB}$。
>
> **Reasoning:**
> - $NF=10\log_{10} F=10\log_{10}2=3.01\,\text{dB}$。

### Problem 8: Friis 公式
两级放大器：第一级 $F_1=2,\,G_1=10$，第二级 $F_2=5$。求总噪声系数 $F_{total}$。

> [!example]- Solution
> **Answer:** $F_{total}=2.4$。
>
> **Reasoning:**
> - $F_{total}=F_1+(F_2-1)/G_1=2+(5-1)/10=2.4$。

### Problem 9: 器件选择
要求低噪声且高输入阻抗的高频小信号放大器，优先选 BJT 还是 FET？

> [!example]- Solution
> **Answer:** FET。
>
> **Reasoning:**
> - FET 输入阻抗高、噪声通常更低。

### Problem 10: 通频带变化趋势
在其他条件不变时，若 $Q$ 增大一倍，通频带如何变化？

> [!example]- Solution
> **Answer:** 通频带减半。
>
> **Reasoning:**
> - $2\Delta f_{0.7}=f_0/Q$，$Q$ 增大一倍则带宽变为原来一半。

---

> [!tip] 练习策略
> 先做 1-3 巩固选择性与带宽，再做 7-8 噪声计算。
