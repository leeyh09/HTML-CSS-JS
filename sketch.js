// 파일: sketch.js

let player;
let gravity = 0.6; // 중력
let jumpStrength = -15; // 최대 점프 힘
let platforms = []; // 플랫폼 배열
let obstacles = []; // 장애물 배열
let jumpPower = 0; // 점프 충전
let baseBackgroundColor = [50, 150, 200]; // 기본 배경 색상
let score = 0; // 점수
let platformTypes = ["normal", "moving", "disappearing"]; // 플랫폼 유형
const maxPlatforms = 10; // 플랫폼 최대 개수

function setup() {
  createCanvas(400, 600);
  
  // 플레이어 초기화
  player = new Player(200, 500);

  // 시작 플랫폼
  platforms.push(new Platform(150, 550, 100, 10, "normal"));

  // 초기 플랫폼 생성
  for (let i = 1; i < 6; i++) {
    generatePlatform(i * 100);
  }
}

function draw() {
  // 배경 색상 동적 변경
  let bgColor = map(player.y, height, 0, 0, 255);
  background(baseBackgroundColor[0] - bgColor * 0.2, baseBackgroundColor[1] - bgColor * 0.3, baseBackgroundColor[2] - bgColor * 0.4);

  // 점수 표시
  textSize(16);
  fill(255);
  text(`점수: ${score}`, 10, 20);

  // 플레이어 및 화면 이동 처리
  let offsetY = 0;
  if (player.y < height / 2) {
    offsetY = height / 2 - player.y; // 화면 위로 이동
    player.y = height / 2; // 플레이어 고정
  }

  // 플랫폼 업데이트 및 그리기
  for (let i = platforms.length - 1; i >= 0; i--) {
    let platform = platforms[i];
    platform.update();
    platform.display(offsetY);

    // 사라진 플랫폼 제거
    if (platform.type === "disappearing" && platform.isGone) {
      platforms.splice(i, 1);
    }
  }

  // 장애물 업데이트 및 그리기
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obstacle = obstacles[i];
    obstacle.update();
    obstacle.display(offsetY);

    // 화면 아래로 사라진 장애물 제거
    if (obstacle.y > height) {
      obstacles.splice(i, 1);
    }
  }

  // 플레이어 업데이트 및 그리기
  player.update(offsetY);
  player.display();

  // 새로운 플랫폼 생성 조건
  if (player.y < height / 2) {
    generatePlatform(player.y - height / 2);
    score++; // 점수 증가

    // 새로운 장애물 또는 적 추가
    if (score % 5 === 0) {
      generateObstacle(player.y - height / 2);
    }
  }

  // 플랫폼 개수 제한
  if (platforms.length > maxPlatforms) {
    platforms.shift(); // 가장 오래된 플랫폼 제거
  }

  // 게임 오버 조건
  if (player.y > height) {
    noLoop();
    textSize(32);
    text("게임 오버", width / 2 - 70, height / 2);
  }
}

function keyPressed() {
  // 점프 키 충전 시작 (스페이스바)
  if (keyCode === 32 && player.isOnPlatform) {
    jumpPower = 0; // 점프 충전을 새로 시작
  }
}

function keyReleased() {
  // 점프 키에서 손을 뗄 때 점프 (스페이스바)
  if (keyCode === 32 && player.isOnPlatform) {
    player.jump(jumpPower); // 충전된 만큼 점프
    jumpPower = 0; // 충전 초기화
  }
}

// 새로운 플랫폼 생성 함수
function generatePlatform(y) {
  let x = random(50, width - 150);
  let w = random(80, 120);
  let type = random(platformTypes);
  platforms.push(new Platform(x, y, w, 10, type));
}

// 새로운 장애물 생성 함수
function generateObstacle(y) {
  let x = random(50, width - 50);
  let type = random(["spike", "enemy"]);
  obstacles.push(new Obstacle(x, y, 30, 30, type));
}

// 플레이어 클래스
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 30;
    this.ySpeed = 0; // y 방향 속도
    this.isOnPlatform = false;
  }

  update(offsetY) {
    // 중력 적용
    this.ySpeed += gravity;
    this.y += this.ySpeed;

    // 플랫폼 충돌 확인
    this.isOnPlatform = false;
    for (let platform of platforms) {
      if (
        this.x + this.w > platform.x &&
        this.x < platform.x + platform.w &&
        this.y + this.h >= platform.y &&
        this.y + this.h <= platform.y + 5 &&
        this.ySpeed >= 0 // 낙하 중일 때만 충돌 처리
      ) {
        // 플랫폼 위에 안정적으로 착지
        this.y = platform.y - this.h;
        this.ySpeed = 0;
        this.isOnPlatform = true;

        // 특수 플랫폼 동작
        if (platform.type === "disappearing") {
          platform.activate();
        }
      }
    }

    // 장애물 충돌 확인
    for (let obstacle of obstacles) {
      if (
        this.x + this.w > obstacle.x &&
        this.x < obstacle.x + obstacle.w &&
        this.y + this.h > obstacle.y &&
        this.y < obstacle.y + obstacle.h
      ) {
        // 적 또는 장애물에 닿으면 게임 오버
        noLoop();
        textSize(32);
        text("장애물에 부딪혔습니다!", width / 2 - 100, height / 2);
      }
    }

    // 방향 이동
    if (keyIsDown(LEFT_ARROW)) {
      this.x -= 5;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.x += 5;
    }

    // 화면 밖으로 나가지 않도록 제한
    this.x = constrain(this.x, 0, width - this.w);

    // 점프 충전
    if (keyIsDown(32) && this.isOnPlatform) {
      jumpPower = constrain(jumpPower + 0.3, 0, -jumpStrength);
    }

    // 화면 스크롤에 따라 이동
    this.y += offsetY;
  }

  display() {
    fill(255, 0, 0);
    rect(this.x, this.y, this.w, this.h);

    // 점프 충전 표시
    if (this.isOnPlatform) {
      fill(255, 255, 0);
      rect(this.x, this.y - 10, map(jumpPower, 0, -jumpStrength, 0, this.w), 5);
    }
  }

  jump(power) {
    if (this.isOnPlatform) {
      this.ySpeed = power > 0 ? -1 * power : power; // 점프 힘 적용
      this.isOnPlatform = false; // 점프 중에는 플랫폼 상태를 해제
    }
  }
}

// 플랫폼 클래스
class Platform {
  constructor(x, y, w, h, type = "normal") {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.isGone = false; // 사라지는 플랫폼 상태
    this.timer = 0; // 사라지는 플랫폼 타이머
    this.speed = random(1, 3); // 움직이는 플랫폼 속도
  }

  update() {
    // 움직이는 플랫폼 동작
    if (this.type === "moving") {
      this.x += this.speed;
      if (this.x < 0 || this.x + this.w > width) {
        this.speed *= -1; // 방향 반전
      }
    }

    // 사라지는 플랫폼 타이머 증가
    if (this.type === "disappearing" && this.timer > 0) {
      this.timer++;
      if (this.timer > 60) {
        this.isGone = true;
      }
    }
  }

  display(offsetY) {
    this.y += offsetY; // 화면 스크롤에 따라 이동

    if (this.isGone) return; // 사라진 플랫폼은 표시하지 않음

    if (this.type === "normal") fill(0, 200, 0);
    if (this.type === "moving") fill(200, 200, 0);
    if (this.type === "disappearing") fill(200, 0, 0);

    rect(this.x, this.y, this.w, this.h);
  }

  activate() {
    // 사라지는 플랫폼 활성화
    if (this.type === "disappearing") {
      this.timer = 1;
    }
  }
}

// 장애물 클래스
class Obstacle {
  constructor(x, y, w, h, type) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.speed = type === "enemy" ? random(2, 4) : 0; // 적은 움직임
  }

  update() {
    // 적의 움직임 처리
    if (this.type === "enemy") {
      this.x += this.speed;
      if (this.x < 0 || this.x + this.w > width) {
        this.speed *= -1; // 방향 반전
      }
    }
  }

  display(offsetY) {
    this.y += offsetY; // 화면 스크롤에 따라 이동

    if (this.type === "spike") {
      fill(200, 0, 0);
    } else if (this.type === "enemy") {
      fill(0, 0, 200);
    }
    rect(this.x, this.y, this.w, this.h);
  }
}
