---
title: 'Zigbee vs WiFi vs LoRa：農業IoTに最適な無線通信プロトコルの選び方'
date: '2026-04-03'
category: 'technology'
excerpt: '農業IoTでセンサーやスマートスイッチを接続する無線プロトコルは複数あるが、用途によって最適解は異なる。Zigbee・WiFi・LoRa・Thread/Matterの特性を比較し、室内水耕栽培と露地栽培それぞれに適した構成を解説する。'
image: '/images/blog/zigbee-wifi-lora-agriculture-iot-protocol.webp'
---

農業にIoTを導入しようとしたとき、最初にぶつかる壁が「どの無線通信プロトコルを使うか」という選択です。EC/pHセンサー、温湿度センサー、スマートスイッチ、カメラ――これらをどうつなぐかで、システムの安定性・拡張性・コストが大きく変わります。

本記事では、農業IoTでよく使われる4つの無線プロトコルを比較し、用途別の最適な選び方を解説します。

## 主要プロトコルの比較

農業IoTで検討すべきプロトコルは主に以下の4つです。

| 項目 | Zigbee | WiFi | LoRa | Thread/Matter |
|------|--------|------|------|---------------|
| 通信距離 | 10-100m | 15-50m | 5-15km | 10-100m |
| 消費電力 | 低 | 高 | 極低 | 低 |
| メッシュ対応 | 対応 | 非対応 | 非対応 | 対応 |
| データレート | 250kbps | 数百Mbps | 0.3-50kbps | 250kbps |
| モジュール単価 | 500-1,500円 | 300-1,000円 | 1,500-3,000円 | 1,000-2,000円 |

一見するとWiFiが万能に見えますが、消費電力の問題でバッテリー駆動のセンサーには不向きです。逆にLoRaは超省電力・長距離ですが、データ量が極めて少なくリアルタイム制御には使えません。

## 室内水耕栽培にはZigbeeが最適

室内の植物工場や水耕栽培システムでは、**Zigbee + WiFiのハイブリッド構成**が現在最も実用的です。

**Zigbeeが室内に強い理由：**

- **メッシュネットワーク**: AC給電のスマートスイッチ（SONOFF等）がルーターとして機能し、自動的にメッシュを構築。部屋の隅々までセンサーデータを中継できる
- **デバイスの豊富さ**: 温湿度センサー、スマートプラグ、LED調光スイッチなど、数千種類の対応デバイスが安価に入手可能
- **低消費電力**: 電池駆動のセンサーが1〜2年動作。配線不要で設置が柔軟
- **Zigbee2MQTTによる統合**: OSSのブリッジソフトウェアにより、全Zigbeeデバイスを標準的なMQTTプロトコルで一元管理できる

**WiFiを併用する理由：**

WiFiはデータ量が多い用途に使います。IPカメラの映像ストリーミング、Raspberry PiからクラウドへのデータアップロードなどはWiFiの領域です。

実際の構成例：

```
[Zigbeeセンサー群] → [Zigbee2MQTT] → [MQTTブローカー] → [Raspberry Pi]
                                                              ↓ WiFi
[IPカメラ] → WiFi ────────────────────────────────────→ [クラウド(Supabase)]
```

この構成では、センサーデータの収集と機器制御はZigbee経由のMQTTで行い、クラウドへのデータ蓄積とカメラ映像はWiFi経由で行います。役割を明確に分離することで、安定性と拡張性を両立できます。

## 露地栽培・広域農場にはLoRaが有力

一方、屋外の広大な農地では事情が異なります。

LoRa/LoRaWANはSub-GHz帯（日本では920MHz）を使用し、見通しの良い環境では10km以上の通信距離を実現します。数十ヘクタールの農地に散在する土壌水分センサーを、少数のゲートウェイでカバーできるため、屋外農業IoTでは事実上の標準となりつつあります。

IIJがLoRaWANやWiFi HaLow（802.11ah）を活用したスマート農業の実証実験を報告しており、日本国内でも導入事例が増えています。

ただし、LoRaはデータレートが極めて低い（最大50kbps）ため、リアルタイムでの機器制御には不向きです。「1時間に1回、土壌水分値を送信する」ような低頻度のモニタリングが主な用途です。

## 2026年の注目：Thread/Matter

2026年、IoT業界で最も注目されているのがThread/Matterプロトコルです。

**Threadの特徴：**
- IPv6ネイティブ（ブリッジ不要でIPネットワークに参加）
- 自己修復型メッシュネットワーク
- Zigbeeと同じIEEE 802.15.4無線規格がベース

Thread 1.4では「マルチベンダーメッシュ」が実現し、異なるメーカーのBorder Router間での相互運用性が大幅に向上しました。IKEA、Aqara、Philips Hueなどの大手がThread対応製品を投入しており、スマートホーム分野では急速に普及が進んでいます。

**しかし、農業分野への展開はまだこれから**です。EC/pHセンサーや植物育成LED制御など、農業特有のデバイスでThread/Matter対応のものはほぼ存在しません。農業用途でThreadが本格化するのは2027〜2028年になると予想されます。

注目すべきは、ThreadとZigbeeが同じ802.15.4無線規格をベースにしている点です。将来Thread対応デバイスが農業分野に広がった際、コーディネーターの交換だけで段階的に移行できる可能性があります。

## プロトコル選定のフローチャート

用途に応じた選定基準をまとめます。

1. **通信距離が100m以下（室内・温室）** → Zigbee + WiFi
2. **通信距離が1km以上（露地・圃場）** → LoRa/LoRaWAN
3. **カメラ映像・大容量データ** → WiFi
4. **将来のIP統合を重視** → Thread/Matter（ただし農業用デバイスは要確認）

多くの場合、単一プロトコルで全てをカバーするのは困難です。**用途に応じたハイブリッド構成が現実解**です。

## Optiensの取り組み

Optiensでは室内LED水耕栽培システムにおいて、Zigbee2MQTT + Raspberry Pi構成を採用しています。SONOFFのZigbeeスマートスイッチでLED照明・循環ポンプ・ヒーターを制御し、各種センサーのデータをMQTT経由でSupabaseに蓄積。クラウドへのデータ送信とAIによる環境最適化にはWiFiを使用するハイブリッド構成です。

将来的にThread/Matter対応デバイスが農業分野に広がった際にも、同じ802.15.4ベースのため段階的な移行が可能な設計としています。

## まとめ

農業IoTの無線プロトコル選定は、「室内か屋外か」「リアルタイム制御が必要か」「どのくらいの規模か」で大きく変わります。室内水耕栽培ではZigbee + WiFiのハイブリッドが最もバランスが良く、露地栽培ではLoRaが有力です。Thread/Matterは将来有望ですが、農業用デバイスの充実を待つのが賢明でしょう。

---

**参考資料:**
- [TEKTELIC: LoRaWAN vs Zigbee](https://tektelic.com/expertise/lorawan-vs-zigbee/)
- [DFRobot: Wireless Technologies Comparison](https://www.dfrobot.com/blog-1646.html)
- [GAO Tek: Comprehensive Guide for Zigbee Enabled Agriculture IoT](https://gaotek.com/comprehensive-guide-for-zigbee-enabled-agriculture-iot/)
- [IEEE Spectrum: Thread 1.4](https://spectrum.ieee.org/mesh-network-interoperable-thread)
- [IIJ: LoRaWAN/WiFi HaLow スマート農業](https://businessnetwork.jp/article/22895/)
