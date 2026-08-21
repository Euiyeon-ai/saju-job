# saju-job

사주 직업 해석이 **어디서 만들어지는지** 해부하는 도구.

배포: https://euiyeon-ai.github.io/saju-job/

## 상태

- [x] repo 생성 · 배포 파이프라인 확인 (2026-08-14)
- [x] 기존 도구(`saju-job.html`) 이사 + 배포 (2026-08-14)
- [x] 생년월일시 입력 → 만세력 자동 계산 (2026-08-19)
- [x] 호칭·현재 상황 입력 + 「추천하는 행동」 칸 (2026-08-21)
- [ ] 기획서 본문

## 구조

```
saju-job/
├─ index.html      배포되는 페이지
├─ docs/           기획 · 설계 · 결정 로그
├─ src/            분리한 소스 (이식 후)
└─ test/           만세력 계산 테스트
```

## 관련

- 통계 검정 (별개 프로젝트, null 결과): `01.idea/saju-stats/docs/08-결과.md`
- 도구 비평 글: `blog/content/posts/saju-job-tool-critique.md`
- 만세력 엔진 원본: `01.idea/saju-stats/scripts/saju.py`
