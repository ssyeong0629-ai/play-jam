# PLAY JAM — GitHub 업로드 경량본

1. ZIP 압축을 풉니다.
2. GitHub 저장소에서 Add file → Upload files를 선택합니다.
3. 이 폴더 안의 index.html, css, js, assets를 함께 끌어 놓습니다.
4. Commit changes를 누릅니다. ZIP 자체나 바깥 PLAY-JAM-upload 폴더는 올리지 않습니다.

56개 녹음을 모두 유지하되 MP3 모노 32kHz / 80kbps로 압축해 assets/audio/bank.js에 내장했습니다. 별도 WAV와 중복 SVG 파일을 제외했습니다. 아이콘 SVG는 js/icons.js 안에 있어 모양이 없어지지 않습니다. 로컬 index.html 직접 실행과 오프라인 음원 재생도 유지합니다.
MP3는 손실 압축이므로 원본 WAV와 음질이 완전히 같지는 않습니다. 편집 기능과 36개 아이콘의 음원 대응은 동일합니다. 전체 초기화·Delete 모드·사이드바 접기·56개 샘플 확장 기능을 포함합니다.
음원 출처와 CC0 라이선스는 assets/audio의 문서를 참고하세요. FEATURE-AUDIT.md는 원본 통합본의 점검 결과입니다. 경량본은 56개 MP3 변환 후 디코딩 및 길이를 별도로 검사했습니다.
