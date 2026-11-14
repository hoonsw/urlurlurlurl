# Synology 시험 배포

GitHub는 코드를 검증하고 릴리스 이미지를 GHCR에 발행한다. DSM 작업 스케줄러는 공개 릴리스의 image.txt를 읽고 지정된 이미지로 시험 컨테이너를 갱신한다. GitHub에 NAS 관리자 계정이나 접속 키를 등록할 필요가 없다.

릴리스를 만들 때는 검토한 커밋에 새 버전 태그(예: `v1.2.3`)를 붙여 GitHub에 push한다. Actions가 해당 커밋으로 테스트한 이미지를 발행하고 정확한 이미지 digest를 담은 `image.txt`를 첨부해 Release를 만든다. `v1.2.3-rc.1`처럼 하이픈 접미사가 있는 버전은 prerelease이며 NAS의 latest 조회에서 제외된다. 실패한 릴리스는 Actions 로그를 확인하고, 이미 발행된 태그는 수정하지 않는다.

1. NAS 관리자 전용 폴더에 이 디렉터리의 compose.yaml과 update.sh를 둔다. Docker를 실행하는 예약 작업이 이 파일을 읽으므로 관리자에게만 쓰기를 허용한다.
2. Container Manager가 설치된 DSM에서 docker compose ?? docker-compose, flock, curl을 사용할 수 있는지 확인한다. GHCR 패키지 가시성을 Public으로 설정하고 공개 릴리스에서 image.txt를 내려받을 수 있는지 확인한다.
3. DSM 작업 스케줄러에서 이 폴더의 실제 경로로 `sh /실제경로/update.sh`를 실행한다. 최초 실행은 수동으로 확인하고, 이후 10분 간격으로 실행한다. 기본 시험 포트는 NAS 내부 18766이다. 다른 시험 프로젝트가 이 포트를 사용 중이면 HOST_PORT를 별도로 설정한다. 역방향 프록시를 연결하면 PUBLIC_URL에 사용자가 접속할 HTTPS 주소를 지정한다.
4. DSM 로그에서 Healthy 메시지를 확인하고 링크 생성·이동을 시험한다. DB는 이 Compose 프로젝트의 전용 볼륨에 저장된다. 기존 Cloudflare KV와 다른 Compose 프로젝트의 데이터 이관은 별도로 수행한다.

업데이트 실패 시 직전에 사용한 로컬 이미지로 컨테이너를 다시 올린다. 데이터 스키마를 바꾸는 업데이트는 별도의 백업과 복구 시험이 필요하다. 긴급 복구 시 예약 작업을 중지하고 정상으로 확인된 digest를 APP_IMAGE로 지정해 같은 프로젝트 이름으로 실행한다.
