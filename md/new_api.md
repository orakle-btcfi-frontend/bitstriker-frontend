# BTC Options API 분석 보고서

## 📊 프로젝트 개요

**BTC Options Trading API**는 Rust와 Actix-web으로 구축된 비트코인 옵션 거래 플랫폼입니다. Black-Scholes 모델을 사용한 실시간 옵션 가격 계산, 리스크 관리, 그리고 포트폴리오 분석 기능을 제공합니다.

### 🏗️ 아키텍처

- **메인 서버**: `127.0.0.1:8080` (주요 API)
- **Mock 서버**: `127.0.0.1:8081` (IV 데이터 폴백)
- **데이터베이스**: SQLite (계약 및 프리미엄 히스토리)
- **외부 연동**: Deribit API (IV), gRPC Oracle (BTC 가격), Mutiny Wallet (잔고)

---

## 🔌 API 엔드포인트 상세 분석

### 1. 헬스체크 엔드포인트

#### `GET /` 또는 `GET /health`

**기능**: 서버 상태 확인

**요청**:

```http
GET http://127.0.0.1:8080/health
```

**응답**:

```json
{
  "status": "healthy",
  "service": "BTC Options API",
  "version": "1.0.0"
}
```

---

### 2. 옵션 테이블 생성

#### `GET /optionsTable`

**기능**: 110개의 옵션 상품 자동 생성 (11개 행사가 × 5개 만료일 × 2개 사이드)

**요청**:

```http
GET http://127.0.0.1:8080/optionsTable
```

**특징**:

- 현재 BTC 가격 기준 ±$5,000 간격으로 11개 행사가 생성
- 만료일: 1d, 2d, 3d, 5d, 7d
- Black-Scholes 모델로 프리미엄 계산
- 리스크 기반 최대 거래량 계산

**응답**:

```json
[
  {
    "side": "Call",
    "strike_price": 110000.0,
    "expire": "1d",
    "premium": "0.00123456",
    "max_quantity": "15.67890123",
    "iv": 0.4234,
    "delta": 0.1234
  },
  {
    "side": "Put",
    "strike_price": 110000.0,
    "expire": "1d",
    "premium": "0.00056789",
    "max_quantity": "8.12345678",
    "iv": 0.4234,
    "delta": -0.0987
  }
]
```

**응답 필드**:

- `side`: "Call" 또는 "Put"
- `strike_price`: 행사가 (USD)
- `expire`: 만료 기간 ("1d", "2d", "3d", "5d", "7d")
- `premium`: 옵션 프리미엄 (BTC, 문자열로 정밀도 보장)
- `max_quantity`: 리스크 기반 최대 거래량 (BTC, 문자열)
- `iv`: 내재 변동성 (Deribit에서 가져옴)
- `delta`: 델타 값 (Black-Scholes 계산)

---

### 3. 옵션 계약 생성

#### `POST /contract`

**기능**: 새로운 옵션 계약 생성 및 리스크 검증

**요청**:

```http
POST http://127.0.0.1:8080/contract
Content-Type: application/json

{
  "side": "Put",
  "strike_price": 110000.0,
  "quantity": 0.5,
  "expires": 1735689600,
  "premium": 0.001234
}
```

**요청 필드**:

- `side`: "Call" 또는 "Put" (필수)
- `strike_price`: 행사가 USD (필수)
- `quantity`: 거래량 BTC (필수, max_quantity 초과 불가)
- `expires`: Unix 타임스탬프 초 단위 (필수, 미래 시간)
- `premium`: 프리미엄 BTC (필수)

**성공 응답 (200)**:

```http
HTTP/1.1 200 OK
```

**실패 응답 (400)**:

```json
{
  "error": "Bad request",
  "message": "Requested quantity (0.50000000) exceeds maximum allowed quantity (0.25000000). Available collateral: $42,500.00, Existing risk exposure: $12,340.00, Total collateral pool: $84,945.00"
}
```

**검증 로직**:

1. 만료일이 미래인지 확인
2. 포트폴리오 리스크 계산
3. 담보 충분성 검증
4. 최대 거래량 한도 확인

---

### 4. 계약 목록 조회

#### `GET /contracts`

**기능**: 생성된 모든 계약 조회 (디버깅용)

**요청**:

```http
GET http://127.0.0.1:8080/contracts
```

**응답**:

```json
[
  {
    "side": "Put",
    "strike_price": 110000.0,
    "quantity": "0.50000000",
    "expires": 1735689600,
    "premium": "0.00123400"
  }
]
```

**응답 필드**:

- `side`: 옵션 사이드
- `strike_price`: 행사가 (USD)
- `quantity`: 거래량 (BTC, 문자열로 정밀도 보장)
- `expires`: 만료 타임스탬프
- `premium`: 프리미엄 (BTC, 문자열)

---

### 5. 포트폴리오 델타 계산

#### `GET /delta`

**기능**: 전체 포트폴리오의 델타 계산

**요청**:

```http
GET http://127.0.0.1:8080/delta
```

**응답**:

```json
-0.1234567890123456
```

**설명**:

- 단일 숫자로 포트폴리오의 BTC 가격 민감도 표현
- 양수: BTC 가격 상승 시 수익
- 음수: BTC 가격 하락 시 수익

---

### 6. 시장 통계 배너

#### `GET /topBanner`

**기능**: 대시보드용 24시간 시장 통계

**요청**:

```http
GET http://127.0.0.1:8080/topBanner
```

**응답**:

```json
{
  "volume_24hr": 1.2345,
  "open_interest_usd": 45678.9,
  "contract_count": 42
}
```

**응답 필드**:

- `volume_24hr`: 24시간 거래량 (BTC)
- `open_interest_usd`: 미결제약정 (USD)
- `contract_count`: 활성 계약 수

---

### 7. 시장 하이라이트

#### `GET /marketHighlights`

**기능**: 24시간 거래량 상위 6개 상품

**요청**:

```http
GET http://127.0.0.1:8080/marketHighlights
```

**응답**:

```json
[
  {
    "product_symbol": "BTC-23h-110000-Put",
    "side": "Put",
    "strike_price": 110000.0,
    "expire": "23h",
    "volume_24hr": 0.5678,
    "price_change_24hr_percent": 12.34
  }
]
```

**응답 필드**:

- `product_symbol`: 상품 심볼
- `side`: 옵션 사이드
- `strike_price`: 행사가 (USD)
- `expire`: 만료까지 남은 시간
- `volume_24hr`: 24시간 거래량 (BTC)
- `price_change_24hr_percent`: 24시간 가격 변동률 (%)

---

### 8. 상위 수익률 상품

#### `GET /topGainers`

**기능**: 24시간 수익률 상위 5개 상품

**요청**:

```http
GET http://127.0.0.1:8080/topGainers
```

**응답**:

```json
[
  {
    "product_symbol": "BTC-2d-115000-Call",
    "side": "Call",
    "strike_price": 115000.0,
    "expire": "2d",
    "change_24hr_percent": 25.67,
    "last_price": 0.002345
  }
]
```

**응답 필드**:

- `product_symbol`: 상품 심볼
- `side`: 옵션 사이드
- `strike_price`: 행사가 (USD)
- `expire`: 만료까지 남은 시간
- `change_24hr_percent`: 24시간 변동률 (%)
- `last_price`: 최근 가격 (BTC)

---

### 9. 상위 거래량 상품

#### `GET /topVolume`

**기능**: USD 거래량 상위 5개 상품

**요청**:

```http
GET http://127.0.0.1:8080/topVolume
```

**응답**:

```json
[
  {
    "product_symbol": "BTC-1d-108000-Put",
    "side": "Put",
    "strike_price": 108000.0,
    "expire": "1d",
    "volume_usd": 12345.67,
    "last_price": 0.001234
  }
]
```

**응답 필드**:

- `product_symbol`: 상품 심볼
- `side`: 옵션 사이드
- `strike_price`: 행사가 (USD)
- `expire`: 만료까지 남은 시간
- `volume_usd`: USD 거래량
- `last_price`: 최근 가격 (BTC)

---

## 🔧 Mock API 엔드포인트

### Mock IV 서버 (포트 8081)

#### `GET /iv`

**기능**: IV 데이터 폴백 서비스 (Deribit 장애 시)

**요청**:

```http
GET http://127.0.0.1:8081/iv?side=C&strike_price=50000&expire=1d
```

**쿼리 파라미터**:

- `side`: "C" (Call) 또는 "P" (Put)
- `strike_price`: 행사가 (USD)
- `expire`: 만료 기간

**응답**:

```json
0.5234
```

**계산 로직**:

```
IV = 0.5 + |strike_price - 50000| / 50000 * 0.1
```

---

## 📊 데이터 구조

### 1. 옵션 사이드 열거형

```rust
enum OptionSide {
    Call,
    Put,
}
```

### 2. 계약 구조체 (API용)

```rust
struct Contract {
    side: OptionSide,
    strike_price: f64,    // USD
    quantity: f64,        // BTC
    expires: i64,         // Unix timestamp
    premium: f64,         // BTC
}
```

### 3. 옵션 테이블 응답

```rust
struct OptionsTableResponse {
    side: OptionSide,
    strike_price: f64,
    expire: String,
    premium: String,      // BTC (정밀도를 위한 문자열)
    max_quantity: String, // BTC (정밀도를 위한 문자열)
    iv: f64,
    delta: f64,
}
```

### 4. 에러 응답 구조

```json
{
  "error": "에러 타입",
  "message": "상세 에러 메시지"
}
```

**에러 타입**:

- `"Bad request"` (400): 검증 실패
- `"Internal server error"` (500): 데이터베이스 오류
- `"Service unavailable"` (503): 외부 API 오류
- `"Price service unavailable"` (503): 가격 오라클 오류
- `"Not found"` (404): 리소스 없음

---

## 🔐 보안 및 검증

### 1. 입력 검증

- 만료일 미래 시간 검증
- 수치 범위 검증
- 필수 필드 존재 확인

### 2. 리스크 관리

- 포트폴리오 리스크 계산
- 담보 충분성 검증
- 최대 거래량 제한
- 20% 안전 마진 적용

### 3. 정밀도 관리

- BTC 금액은 문자열로 저장/전송
- 8자리 소수점 정밀도 보장
- USD는 센트 단위로 내부 저장

---

## 🌐 외부 연동

### 1. Deribit API

- **용도**: 내재 변동성 (IV) 데이터
- **엔드포인트**: `https://www.deribit.com/api/v2`
- **폴백**: Mock IV 서버 (포트 8081)

### 2. gRPC Price Oracle

- **용도**: 실시간 BTC 가격
- **주소**: `http://localhost:50051`
- **프로토콜**: gRPC

### 3. Mutiny Wallet API

- **용도**: BTC 지갑 잔고 조회
- **네트워크**: Mainnet/Testnet/Signet
- **인증**: API 키 기반

---

## 📈 성능 및 최적화

### 1. 캐싱 전략

- IV 데이터 메모리 캐싱
- 백그라운드 데이터 업데이트
- 데이터베이스 인덱스 최적화

### 2. 동시성 처리

- Actix-web 비동기 처리
- 데이터베이스 연결 풀
- 외부 API 병렬 호출

### 3. 오류 복구

- 외부 API 폴백 메커니즘
- 재시도 로직
- 우아한 성능 저하

---

## 🚀 배포 및 운영

### 1. 환경 설정

```env
# 핵심 설정
RISK_FREE_RATE=0.05
COLLATERAL_RATE=0.5
RISK_MARGIN=1.2

# 지갑 설정
POOL_ADDRESS=your_btc_address
POOL_NETWORK=signet

# 외부 서비스
AGGREGATOR_URL=http://localhost:50051
DERIBIT_API_URL=https://www.deribit.com/api/v2
```

### 2. 서버 시작

```bash
cargo run --bin btc_options_api
```

### 3. 헬스체크

```bash
curl http://127.0.0.1:8080/health
```

---

## 📋 API 사용 예시

### 1. 옵션 테이블 조회 후 계약 생성

```bash
# 1. 옵션 테이블 조회
curl "http://127.0.0.1:8080/optionsTable"

# 2. 적절한 옵션 선택 후 계약 생성
curl -X POST "http://127.0.0.1:8080/contract" \
  -H "Content-Type: application/json" \
  -d '{
    "side": "Put",
    "strike_price": 110000.0,
    "quantity": 0.1,
    "expires": 1735689600,
    "premium": 0.001234
  }'
```

### 2. 포트폴리오 모니터링

```bash
# 델타 확인
curl "http://127.0.0.1:8080/delta"

# 시장 통계 확인
curl "http://127.0.0.1:8080/topBanner"

# 계약 목록 확인
curl "http://127.0.0.1:8080/contracts"
```

### 3. 시장 분석

```bash
# 상위 수익률 상품
curl "http://127.0.0.1:8080/topGainers"

# 상위 거래량 상품
curl "http://127.0.0.1:8080/topVolume"

# 시장 하이라이트
curl "http://127.0.0.1:8080/marketHighlights"
```

---

이 API는 전문적인 옵션 거래 플랫폼으로서 실시간 가격 계산, 리스크 관리, 포트폴리오 분석 기능을 제공하며, 안정적이고 확장 가능한 아키텍처를 갖추고 있습니다.
