# urlurlurlurl

URL을 늘립니다.

## 요구사항

- 한국어 UI
- `example.com` 입력 시 `https://example.com`으로 보정
- 약 500자 길이의 긴 URL 생성
- 생성된 URL은 원본 URL로 `302` 리다이렉트
- 없는 URL은 `URL이 없습니다.` 표시
- 잘못된 입력은 `URL을 확인해 주세요.` 표시
- 자기 서비스 주소, localhost, 사설 IP, 내부망 주소 차단

## 개발

```bash
npm install
npm test
npm run dev
```

로컬 개발 서버는 보통 `http://localhost:8788`에서 열립니다.

## Cloudflare 설정

Cloudflare Pages 프로젝트에 KV binding을 추가해야 합니다.

- Binding name: `URLS`
- 저장 형식: `slug -> original URL`
- 만료 시간: 없음

처음 배포할 때:

```bash
npx wrangler login
npm run deploy
```

배포 후 Cloudflare Dashboard에서 Pages 프로젝트의 Functions KV binding에 `URLS`를 연결합니다.
그다음 다시 배포하거나 Functions 설정이 반영될 때까지 기다립니다.

배포:

```bash
npm run deploy
```

## NAS에서 실행하기

Node.js 24와 SQLite로 동일한 화면과 API를 실행합니다. 첫 실행 시 빈 데이터베이스가 만들어집니다. 기존 Cloudflare Pages 링크는 해당 서비스의 KV를 계속 사용합니다.

```bash
docker compose up --build -d
```

같은 호스트에서 `http://localhost:18766`을 열 수 있습니다. 외부에서 사용하려면 DSM 역방향 프록시를 이 포트에 연결하고 프로젝트의 `PUBLIC_URL`에 이용자가 실제로 방문할 주소를 지정합니다. SQLite 파일은 Compose의 `links` 볼륨에 저장됩니다. 업그레이드 전에는 서비스를 중지하고 이 볼륨을 백업합니다.

Docker 없이 실행할 때는 `npm run start:nas`로 시작하고 `http://localhost:8080`을 엽니다. `npm test`는 기존 URL 규칙과 NAS에서의 생성·조회·재시작 후 보존을 확인합니다.
