<template>
  <div class="big-screen" ref="screenRef">
    <!-- 视频播放器容器 -->
    <div class="video-container">
      <video
        ref="videoRef"
        class="video-player"
        :src="currentVideo"
        @ended="handleVideoEnd"
        controls
        controlsList="nodownload nofullscreen"
        disablePictureInPicture
        :disableRemotePlayback="true"
        :controlslist="'nodownload nofullscreen noremoteplayback'"
      >
        您的浏览器不支持 video 标签
      </video>
      
      <!-- 播放列表面板 -->
      <div class="playlist-panel" v-show="showPlaylist">
        <div class="playlist-header">
          <h3>播放列表</h3>
          <el-button 
            size="small" 
            type="primary"
            @click="$refs.fileInput.click()"
          >
            添加视频
          </el-button>
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            multiple
            style="display: none"
            @change="handleFileSelect"
          >
        </div>
        
        <div class="playlist-content">
          <div 
            v-for="(item, index) in playlist" 
            :key="index"
            class="playlist-item"
            :class="{ active: index === currentVideoIndex }"
          >
            <span class="item-name">{{ item.name }}</span>
            <el-button 
              size="small" 
              type="danger"
              @click="removeVideo(index)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 视频控制面板 -->
      <div class="video-controls">
        <!-- 播放列表控制 -->
        <div class="playlist-controls">
          <el-button 
            size="small" 
            @click="togglePlaylist"
          >
            {{ showPlaylist ? '隐藏列表' : '显示列表' }}
          </el-button>
          <el-button 
            size="small" 
            @click="playPrevious" 
            :disabled="!hasPrevious"
          >
            上一个
          </el-button>
          <el-button 
            size="small" 
            @click="playNext" 
            :disabled="!hasNext"
          >
            下一个
          </el-button>
          <el-button 
            size="small" 
            @click="toggleLoop"
            :type="isLooping ? 'primary' : ''"
          >
            {{ isLooping ? '循环开' : '循环关' }}
          </el-button>
        </div>

        <!-- 全屏控制 -->
        <div class="fullscreen-control">
          <el-button 
            type="primary"
            size="small"
            @click="toggleFullscreen"
          >
            <i :class="isFullscreen ? 'el-icon-close' : 'el-icon-full-screen'"></i>
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 礼物动画容器 -->
    <div class="gift-container" :class="{ 'fullscreen': isFullscreen }">
      <!-- 礼物动画内容 -->
    </div>
  </div>
</template>

<script>
export default {
  name: 'BigScreen',
  data() {
    return {
      rankList: [
        { programName: '舞蹈《青花瓷》', rocketCount: 88 },
        { programName: '歌曲《奔跑》', rocketCount: 66 },
        { programName: '相声《快乐生活》', rocketCount: 55 },
        { programName: '魔术《魔法时刻》', rocketCount: 44 },
        { programName: '小品《欢乐时光》', rocketCount: 33 },
      ],
      giftRecords: [
        { time: '20:15:30', sender: '张三', programName: '舞蹈《青花瓷》', giftType: '🚀火箭' },
        { time: '20:14:25', sender: '李四', programName: '歌曲《奔跑》', giftType: '🚀火箭' },
        { time: '20:13:18', sender: '王五', programName: '相声《快乐生活》', giftType: '🚀火箭' },
        { time: '20:12:05', sender: '赵六', programName: '魔术《魔法时刻》', giftType: '🚀火箭' },
        { time: '20:11:55', sender: '孙七', programName: '小品《欢乐时光》', giftType: '🚀火箭' },
      ],
      
      playlist: [],
      currentVideoIndex: -1,
      isLooping: false,
      showPlaylist: true,
      isFullscreen: false,
      showGift: false,
      giftData: {
        senderAvatar: '',
        realName: '',
        giftCount: 0
      },
      ws: null,
      wsReconnectTimer: null,
      wsReconnectAttempts: 0,
      wsMaxReconnectAttempts: 5,
      processedMessageIds: new Set(),
      isAnimating: false,
      animationQueue: [],
      _isMount: false,
      _hideGiftTimer: null,
      _animationInProgress: false,
      _animationQueue: [],
      _animationTimer: null,
      _transitionTimer: null
    }
  },
  computed: {
    currentVideo() {
      return this.currentVideoIndex >= 0 ? URL.createObjectURL(this.playlist[this.currentVideoIndex].file) : ''
    },
    hasNext() {
      return this.currentVideoIndex < this.playlist.length - 1
    },
    hasPrevious() {
      return this.currentVideoIndex > 0
    }
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        this.playlist.push({
          name: file.name,
          file: file
        })
      })
      if (this.currentVideoIndex === -1 && this.playlist.length > 0) {
        this.playVideo(0)
      }
    },
    playVideo(index) {
      this.currentVideoIndex = index
      this.$nextTick(() => {
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.loop = this.isLooping
          this.$refs.videoPlayer.play()
        }
      })
    },
    removeVideo(index) {
      if (index === this.currentVideoIndex) {
        this.$refs.videoPlayer.pause()
        if (this.hasNext) {
          this.playNext()
        } else if (this.hasPrevious) {
          this.playPrevious()
        } else {
          this.currentVideoIndex = -1
        }
      } else if (index < this.currentVideoIndex) {
        this.currentVideoIndex--
      }
      this.playlist.splice(index, 1)
    },
    playNext() {
      if (this.hasNext) {
        this.playVideo(this.currentVideoIndex + 1)
      }
    },
    playPrevious() {
      if (this.hasPrevious) {
        this.playVideo(this.currentVideoIndex - 1)
      }
    },
    toggleLoop() {
      this.isLooping = !this.isLooping
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.loop = this.isLooping
      }
    },
    handleVideoEnd() {
      if (this.isLooping) {
        this.$refs.videoPlayer.play()
      } else if (this.hasNext) {
        this.playNext()
      }
    },
    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist
    },
    toggleFullscreen() {
      const element = this.$refs.screenRef;
      
      if (!document.fullscreenElement) {
        element.requestFullscreen().then(() => {
          this.isFullscreen = true;
        }).catch(err => {
          console.error('全屏失败:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        }).catch(err => {
          console.error('退出全屏失败:', err);
        });
      }
    },
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    },
    addEventListeners() {
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    removeEventListeners() {
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    _showGiftEffect(gift) {
      console.log('[BigScreen] _showGiftEffect called with:', gift);
      
      // 将礼物添加到队列
      this._animationQueue.push(gift);
      console.log('[BigScreen] Animation queue length:', this._animationQueue.length);
      
      // 如果没有动画在播放，开始播放
      if (!this._animationInProgress) {
        this._playNextAnimation();
      }
    },
    
    _playNextAnimation() {
      if (this._animationQueue.length === 0 || this._animationInProgress) {
        console.log('[BigScreen] No animations to play or animation in progress');
        return;
      }
      
      const gift = this._animationQueue.shift();
      console.log('[BigScreen] Playing animation for gift:', gift);
      
      this._animationInProgress = true;
      
      // 先重置状态
      this.showGift = false;
      this.giftData = gift;
      
      // 使用 nextTick 确保 DOM 更新
      this.$nextTick(() => {
        // 短暂延迟后显示动画
        this._transitionTimer = setTimeout(() => {
          this.showGift = true;
          
          // 设置动画结束定时器
          this._animationTimer = setTimeout(() => {
            console.log('[BigScreen] Animation completed');
            this.showGift = false;
            
            // 等待淡出动画完成
            setTimeout(() => {
              this._animationInProgress = false;
              
              // 检查是否有下一个动画
              if (this._animationQueue.length > 0) {
                console.log('[BigScreen] Playing next animation from queue');
                this._playNextAnimation();
              }
            }, 300); // 等待淡出动画完成
            
          }, 2500); // 动画显示时间
        }, 100); // 短暂延迟以确保状态重置
      });
    },
    testEffects() {
      this._showGiftEffect({
        senderAvatar: '/default-avatar.png',
        realName: '测试用户',
        giftCount: 1
      });
    },
    initWebSocket() {
      console.log('[BigScreen] Initializing WebSocket');
      
      // 确保只有一个 WebSocket 连接
      this.closeWebSocket();
      
      const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${location.host}/ws/gift`;
      
      console.log('[BigScreen] Creating new WebSocket connection:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[BigScreen] WebSocket connected successfully');
        this.wsReconnectAttempts = 0; // 重置重连次数
      };
      
      this.ws.onclose = () => {
        console.log('[BigScreen] WebSocket connection closed');
        if (this._isMount && this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
          console.log('[BigScreen] Attempting to reconnect...');
          this.wsReconnectAttempts++;
          this.wsReconnectTimer = setTimeout(() => {
            console.log('[BigScreen] Reconnecting... Attempt:', this.wsReconnectAttempts);
            this.initWebSocket();
          }, 3000);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[BigScreen] WebSocket error:', error);
      };
      
      this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    },
    closeWebSocket() {
      if (this.ws) {
        console.log('[BigScreen] Closing existing WebSocket connection');
        this.ws.onclose = null; // 移除重连逻辑
        this.ws.close();
        this.ws = null;
      }
      
      if (this.wsReconnectTimer) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = null;
      }
    },
    handleWebSocketMessage(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('[BigScreen] WebSocket message received:', data);
        
        if (data.type === 'gift' && data.giftType === 'rocket') {
          const messageId = `${data.timestamp}-${data.sender}-${data.giftCount}`;
          console.log('[BigScreen] Processing gift message:', messageId);
          
          if (!this.processedMessageIds.has(messageId)) {
            console.log('[BigScreen] New message, showing animation');
            this.processedMessageIds.add(messageId);
            
            this._showGiftEffect({
              senderAvatar: data.senderAvatar,
              realName: data.realName,
              giftCount: data.giftCount
            });
            
            setTimeout(() => {
              console.log('[BigScreen] Removing message from processed cache:', messageId);
              this.processedMessageIds.delete(messageId);
            }, 5000);
          } else {
            console.log('[BigScreen] Duplicate message ignored:', messageId);
          }
        }
      } catch (error) {
        console.error('[BigScreen] Error processing message:', error);
      }
    },
    updateRankList(giftData) {
      const index = this.rankList.findIndex(item => 
        item.programName === giftData.programName
      )
      
      if (index !== -1) {
        this.rankList[index].rocketCount++
        this.rankList.sort((a, b) => b.rocketCount - a.rocketCount)
      } else {
        this.rankList.push({
          programName: giftData.programName,
          rocketCount: 1
        })
      }
    },
    updateGiftRecords(giftData) {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${
        now.getMinutes().toString().padStart(2, '0')}:${
        now.getSeconds().toString().padStart(2, '0')}`
      
      this.giftRecords.unshift({
        time,
        sender: giftData.sender,
        programName: giftData.programName,
        giftType: '🚀火箭'
      })
      
      if (this.giftRecords.length > 20) {
        this.giftRecords.pop()
      }
    },
    handleVisibilityChange() {
      if (document.hidden) {
        console.log('[BigScreen] Page hidden, closing WebSocket');
        this.closeWebSocket();
      } else {
        console.log('[BigScreen] Page visible, reconnecting WebSocket');
        this.initWebSocket();
      }
    }
  },
  mounted() {
    this._isMount = true;
    console.log('[BigScreen] Component mounted');
    
    // 添加调试信息
    window._debugBigScreen = this;
    
    // 移除之前可能存在的事件监听器
    this.removeEventListeners();
    
    // 添加新的事件监听器
    this.addEventListeners();
    
    // 初始化 WebSocket
    this.initWebSocket();
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },
  beforeUnmount() {
    this._isMount = false;
    this.removeEventListeners();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.closeWebSocket();
    
    // 清理所有定时器和队列
    if (this._animationTimer) {
      clearTimeout(this._animationTimer);
      this._animationTimer = null;
    }
    if (this._transitionTimer) {
      clearTimeout(this._transitionTimer);
      this._transitionTimer = null;
    }
    this._animationQueue = [];
    this._animationInProgress = false;
  }
}
</script>

<style scoped>
.big-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 隐藏原生全屏按钮 */
.video-player::-webkit-media-controls-fullscreen-button {
  display: none !important;
}

/* 视频控制面板样式 */
.video-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.playlist-controls {
  display: flex;
  gap: 10px;
}

.fullscreen-control {
  margin-left: auto;
}

.gift-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 3;
}

/* 全屏状态下的样式调整 */
:fullscreen .gift-container {
  position: absolute;
}

/* 兼容不同浏览器的全屏样式 */
:-webkit-full-screen .gift-container {
  position: absolute;
}

:-moz-full-screen .gift-container {
  position: absolute;
}

:-ms-fullscreen .gift-container {
  position: absolute;
}

/* 确保控制面板在全屏时也能显示 */
:fullscreen .video-controls {
  position: fixed;
}

:-webkit-full-screen .video-controls {
  position: fixed;
}

:-moz-full-screen .video-controls {
  position: fixed;
}

:-ms-fullscreen .video-controls {
  position: fixed;
}

/* 播放列表面板样式 */
.playlist-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 3;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.playlist-header h3 {
  margin: 0;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.item-name {
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 确保播放列表在全屏时也能正确显示 */
:fullscreen .playlist-panel {
  position: fixed;
}

:-webkit-full-screen .playlist-panel {
  position: fixed;
}

:-moz-full-screen .playlist-panel {
  position: fixed;
}

:-ms-fullscreen .playlist-panel {
  position: fixed;
}
</style> 