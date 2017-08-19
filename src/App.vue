<template>
  <div class="page">
    <div :class="{'game-container':true,shake: shake, sway}">
      <svg version="1.1" baseProfile="full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path @click="handleTileClick(0)" :class="{lit: tileIsLit[0]}" d="m 25,25 25,-25 25,25 z" id="up-1" />
        <path @click="handleTileClick(1)" :class="{lit: tileIsLit[1]}" d="m 25,25 -25,25 25,25 z" id="left-2" />
        <path @click="handleTileClick(2)" :class="{lit: tileIsLit[2]}" d="m 75,25 25,25 -25,25 z" id="right-3" />
        <path @click="handleTileClick(3)" :class="{lit: tileIsLit[3]}" d="m 25,75 25,25 25,-25 z" id="down-4" />
      </svg>
      <div class="game-controls">
        <div v-if="gamePlayState==='WON'">WINNER!</div>
        <div>Score: {{ score }}</div>
        <div>
          <toggle-button :disabled="gameState==='RUNNING'" @change="strictMode = $event.value" /> Strict mode
        </div>
        <div>
          <button v-if="gameState==='INIT'" @click="handleClickStart" role="button" type="button" class="btn btn-primary">START</button>
          <button v-if="gameState==='RUNNING'" @click="handleClickReset" role="button" type="button" class="btn btn-primary">RESET</button>
        </div>
      </div>
    </div>
    <p>
      Press color tile via mouse click, WASD or arrow keys.
    </p>
    <!-- <p>
                              gameState {{gameState}}
                              <br> gamePlayState {{gamePlayState}}
                              <br>
                              <button @click="sounds[0].play()">0</button>
                              <button @click="sounds[1].play()">1</button>
                              <button @click="sounds[2].play()">2</button>
                              <button @click="sounds[3].play()">3</button>
                              <br>
                              <button @click="playWinningTune">winning tune</button>
                            </p> -->
  </div>
</template>

<script>

import { Howl } from 'howler';
import ToggleButton from 'vue-js-toggle-button';

const playSignalIntervalDelay = [
  1000, 1000, 1000, 1000, 1000,
  800, 800, 800, 800, 800,
  600, 600, 600, 600, 600,
  500, 500, 500, 500, 500
];

export default {
  data() {
    return {
      shake: false,
      sway: false,
      score: 0,
      signal: [],
      signalInterval: null,
      repeatIndex: 0,
      gameState: 'INIT',
      gamePlayState: null,
      strictMode: false,
      sounds: [
        new Howl({ src: ['static/simonSound0.mp3'] }),
        new Howl({ src: ['static/simonSound1.mp3'] }),
        new Howl({ src: ['static/simonSound2.mp3'] }),
        new Howl({ src: ['static/simonSound3.mp3'] })
      ],
      errorBuzzer: new Howl({ src: ['static/wrong.mp3'] }),
      tileIsLit: [false, false, false, false]

    };
  },
  methods: {
    playWinningTune() {
      this.sway = true;
      setTimeout(() => {
        this.sway = false;
      }, 5000);
      const tuneNotes = [3, 3, 3, 2, 2, 2, 1, 1, 1, 0];
      for (let i = 0, delay = 400; i < tuneNotes.length; i++ , delay += 400) {
        setTimeout(() => {
          this.pressTile(tuneNotes[i]);
        }, delay);
      }
    },
    handleTileClick(tileIndex) {
      // in an ideal world gamePlayState would be computed from signalInterval
      // meh, just easier to manage duplicate state for now
      if (this.gamePlayState === 'PLAY_SIGNAL' || this.gameState !== 'RUNNING') {
        return;
      }
      this.pressTile(tileIndex);
      if (this.gamePlayState === 'WON') {
        // alow user to just play notes until they choose to press reset
        return;
      }
      // check if correct or incorrect click
      if (this.signal[this.repeatIndex] != tileIndex) {
        this.shake = true;
        this.errorBuzzer.play();
        setTimeout(() => {
          this.shake = false;
        }, 500);

        if (this.strictMode) {
          this.handleClickReset();
          this.handleClickStart();
          return;
        }
        this.playSignal();
        return;
      }
      this.repeatIndex++;
      if (this.repeatIndex === this.signal.length) {
        this.score++;
        if (this.score === 20) {
          this.gamePlayState = 'WON';
          setTimeout(() => {
            this.playWinningTune();
          }, 1000);
          return;
        }
        this.playNextLevelSignal();
      }
    },
    pressTile(tileIndex) {
      // this.tileIsLit[tileIndex] = true;
      this.$set(this.tileIsLit, tileIndex, true);
      this.sounds[tileIndex].play();
      setTimeout(() => {
        // this.tileIsLit[tileIndex] = false;
        this.$set(this.tileIsLit, tileIndex, false);
      }, 300);
    },
    handleClickStart() {
      this.gameState = 'RUNNING';
      this.playNextLevelSignal();
    },
    playNextLevelSignal() {
      this.signal.push(Math.floor(Math.random() * 4));
      this.playSignal();
    },
    playSignal() {
      this.gamePlayState = 'PLAY_SIGNAL';
      let playIndex = 0;
      setTimeout(() => {
        this.signalInterval = setInterval(() => {
          this.pressTile(this.signal[playIndex]);
          playIndex++;
          if (playIndex === this.signal.length) {
            clearInterval(this.signalInterval);
            this.repeatIndex = 0;
            this.gamePlayState = 'WATCH_REPEAT_SIGNAL';
            return;
          }
        }, playSignalIntervalDelay[this.score]);
      }, 1000);
    },
    handleClickReset() {
      clearInterval(this.signalInterval);
      this.signal = [];
      this.score = 0;
      this.gameState = 'INIT';
      this.gamePlayState = null;
    }
  },
  mounted: function () {
    window.addEventListener('keyup', (event) => {
      if (event.keyCode == 38 || event.keyCode == 87) {
        this.handleTileClick(0);
      }
      if (event.keyCode == 37 || event.keyCode == 65) {
        this.handleTileClick(1);
      }
      if (event.keyCode == 39 || event.keyCode == 68) {
        this.handleTileClick(2);
      }
      if (event.keyCode == 40 || event.keyCode == 83) {
        this.handleTileClick(3);
      }
    });
  },
}
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.game-container {
  width: 95%;
  margin: 0 auto 10px;
  position: relative;
}

@media screen and (min-width: 500px) {
  .game-container {
    width: 80%;
  }
}

@media screen and (min-width: 850px) {
  .game-container {
    width: 50%;
  }
}

svg {
  width: 100%;
}

.game-controls {
  position: absolute;
  left: 25%;
  right: 25%;
  top: 25%;
  bottom: 25%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  >div {
    margin: 10px 0;
  }
}

path {
  &:nth-of-type(1) {
    fill: green;
    &.lit {
      fill: lighten(green, 25%);
    }
  }
  &:nth-of-type(2) {
    fill: red;
    &.lit {
      fill: lighten(red, 30%);
    }
  }
  &:nth-of-type(3) {
    fill: blue;
    &.lit {
      fill: lighten(blue, 30%);
    }
  }
  &:nth-of-type(4) {
    fill: yellow;
    &.lit {
      fill: lighten(yellow, 40%);
    }
  }
}

.shake {
  animation: shake 500ms linear forwards;
}

@keyframes shake {
  0% {
    transform: rotate(-5deg);
  }
  25% {
    transform: rotate(5deg);
  }
  75% {
    transform: rotate(-5deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.sway {
  animation: sway 4500ms linear forwards;
}

@keyframes sway {
  1% {
    transform: rotate(0deg);
  }
  15% {
    transform: rotate(30deg);
  }
  50% {
    transform: rotate(-30deg);
  }
  85% {
    transform: rotate(30deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>
