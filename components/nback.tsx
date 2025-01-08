import { useState, useEffect, useCallback } from 'react';
import styles from './nback.module.css';

// 扩展测试类型
type StimulusType = 'position' | 'color' | 'letter' | 'audio' | 'number' | 'shape';

// 添加新的常量
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBERS = '0123456789'.split('');
const SHAPES = ['circle', 'square', 'triangle', 'star', 'diamond'];
const AUDIO_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']; // 音符示例

interface NBackProps {
  gridSize: number;
  nValue: number;
  testTypes: StimulusType[]; // 更新类型
  interval: number;
}

// 更新状态接口
type Stimulus = {
  position: number;
  color: string;
  letter: string;
  number: string;
  shape: string;
  audio: string;
};

// 更新分数接口
type ScoreType = {
  [key in StimulusType]: {
    correct: number;
    wrong: number;
    missed: number;
  };
};

export const NBack: React.FC<NBackProps> = ({ gridSize, nValue = 1, testTypes, interval = 500 }) => {
  const [history, setHistory] = useState<Stimulus[]>([]);
  const [current, setCurrent] = useState<Stimulus>({
    position: 0,
    color: COLORS[0],
    letter: LETTERS[0],
    number: NUMBERS[0],
    shape: SHAPES[0],
    audio: AUDIO_NOTES[0]
  });
  const [score, setScore] = useState<ScoreType>(() => {
    const initial: Partial<ScoreType> = {};
    testTypes.forEach(type => {
      initial[type] = { correct: 0, wrong: 0, missed: 0 };
    });
    return initial as ScoreType;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [userResponses, setUserResponses] = useState<{[key: string]: boolean | null}>({});

  // 生成新的刺激
  const generateNewStimulus = useCallback(() => {
    // 先检查上一轮的答案
    if (history.length >= nValue) {
      Object.entries(userResponses).forEach(([type, response]) => {
        const stimulusType = type as StimulusType;
        const isMatch = history[history.length - nValue][stimulusType] === current[stimulusType];
        
        setScore(prev => ({
          ...prev,
          [stimulusType]: {
            ...prev[stimulusType],
            correct: response !== null && isMatch === response ? prev[stimulusType].correct + 1 : prev[stimulusType].correct,
            wrong: response !== null && isMatch !== response ? prev[stimulusType].wrong + 1 : prev[stimulusType].wrong,
            missed: response === null ? prev[stimulusType].missed + 1 : prev[stimulusType].missed
          }
        }));
      });
    }

    const newStimulus: Stimulus = {
      position: Math.floor(Math.random() * (gridSize * gridSize)),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
      number: NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      audio: AUDIO_NOTES[Math.floor(Math.random() * AUDIO_NOTES.length)]
    };
    
    setCurrent(newStimulus);
    setHistory(prev => [...prev, newStimulus]);
    // 重置用户响应
    setUserResponses({});
  }, [gridSize, history, current, nValue, userResponses]);

  // 检查匹配
  const checkMatch = (type: 'position' | 'color' | 'letter') => {
    if (history.length < nValue) return;
    const isMatch = history[history.length - nValue][type] === current[type];
    return isMatch;
  };

  // 用户响应处理
  const handleResponse = (type: StimulusType, userSaidMatch: boolean) => {
    setUserResponses(prev => ({
      ...prev,
      [type]: userSaidMatch
    }));
  };

  // 渲染网格
  const renderGrid = () => {
    return (
      <div 
        className={styles.grid}
        style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '4px',
          width: '300px',
          height: '300px'
        }}
      >
        {Array(gridSize * gridSize).fill(0).map((_, i) => (
          <div
            key={i}
            className={styles.cell}
            style={{
            //   backgroundColor: i === current.position ? current.color : 'white',
              border: '1px solid black'
            }}
          >
            {i === current.position && (
              <div className={styles.stimulus + ' ' + styles[current.shape]} style={{ backgroundColor: current.color }}>
                {testTypes.includes('letter') && current.letter}
                {testTypes.includes('number') && current.number}

              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // 添加定时器逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      timer = setInterval(() => {
        generateNewStimulus();
      }, interval);
    }

    // 清理定时器
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, interval, generateNewStimulus]);

  return (
    <div className={styles.container}>
      {renderGrid()}
      <div className={styles.controls}>
        <button onClick={() => {
          const newState = !isPlaying;
          console.log(`游戏状态改变: ${isPlaying ? '暂停' : '开始'} -> ${newState ? '开始' : '暂停'}`);
          setIsPlaying(newState);
        }}>
          {isPlaying ? '暂停' : '开始'}
        </button>
        
        {/* 添加测试类型按钮组 */}
        <div className={styles.matchButtons}>
          {testTypes.map(type => (
            <div key={type} className={styles.matchButtonGroup}>
              <button 
                disabled={history.length < nValue}
                className={`${styles.matchButton} ${userResponses[type] === true ? styles.active : ''}`}
                onClick={() => handleResponse(type, true)}
              >
                {type} 匹配
              </button>
              <button 
                disabled={history.length < nValue}
                className={`${styles.matchButton} ${userResponses[type] === false ? styles.active : ''}`}
                onClick={() => handleResponse(type, false)}
              >
                {type} 不匹配
              </button>
            </div>
          ))}
        </div>

        <div className={styles.scores}>
          {testTypes.map(type => (
            <div key={type}>
              {type}: {score[type].correct} 正确 / {score[type].wrong} 错误 / {score[type].missed} 未响应
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
