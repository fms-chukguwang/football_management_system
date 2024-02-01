// formations.ts
export interface Position {
    x: string;
    y: string;
  }
  
  export interface Formation {
    defenders: Position[];
    midfielders: Position[];
    attackers: Position[];
    goalkeeper: Position;
    positionNames: {
      defenders: string[];
      midfielders: string[];
      attackers: string[];
      goalkeeper: string;
    };
    advantages: string[]; 
    disadvantages: string[]; 
  }
  
  export const formations: { [key: string]: Formation } = {
    '3-4-3': {
        attackers: [
          { x: '10%', y: '15%' }, // LW
          { x: '40%', y: '15%' }, // CF
          { x: '70%', y: '15%' }, // RW
        ],
        midfielders: [
          { x: '0%', y: '40%' }, // LM
          { x: '27%', y: '40%' }, // CM
          { x: '53%', y: '40%' }, // CM
          { x: '80%', y: '40%' }, // RM
        ],
        defenders: [
          { x: '10%', y: '65%' }, // CB
          { x: '40%', y: '65%' }, // CB
          { x: '70%', y: '65%' }, // CB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LCB', 'CB', 'RCB'],
          midfielders: ['LM', 'LCM', 'RCM', 'RM'],
          attackers: ['LF', 'ST', 'RF'],
          goalkeeper: 'GK',
        },
        advantages: [
          "상대 수비진을 넓게 펼쳐 공간을 만들 수 있음."
        ],
        disadvantages: [
          "측면 수비가 약해 상대팀의 측면 공격에 취약함."
        ]
      },
      '3-4-1-2': {
        attackers: [
          { x: '20%', y: '10%' }, // CF
          { x: '60%', y: '10%' }, // CF
        ],
        midfielders: [
          { x: '0%', y: '45%' }, // LM
          { x: '27%', y: '45%' }, // CM
          { x: '40%', y: '25%' }, // AM (공격적 미드필더)
          { x: '53%', y: '45%' }, // CM
          { x: '80%', y: '45%' }, // RM
        ],
        defenders: [
          { x: '10%', y: '65%' }, // CB
          { x: '40%', y: '65%' }, // CB
          { x: '70%', y: '65%' }, // CB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LCB', 'CB', 'RCB'],
          midfielders: ['LM', 'LCM', 'CAM', 'RCM', 'RM'],
          attackers: ['LS', 'RS'],
          goalkeeper: 'GK'
        },
        advantages: [
          "공격적 미드필더가 공격과 수비 사이의 연결고리 역할을 함.",
        ],
        disadvantages: [
          "중앙 수비가 부족하여 대형 공격에 취약할 수 있음.",
        ]
      },
      '4-1-4-1': {
        attackers: [
          { x: '40%', y: '10%' }, // CF
        ],
        midfielders: [
          { x: '0%', y: '30%' }, // LM
          { x: '25%', y: '30%' }, // CM
          { x: '55%', y: '30%' }, // CM
          { x: '80%', y: '30%' }, // RM
          { x: '40%', y: '47%' }, // CDM
        ],
        defenders: [
          { x: '0%', y: '65%' }, // LB
          { x: '25%', y: '65%' }, // CB
          { x: '55%', y: '65%' }, // CB
          { x: '80%', y: '65%' }, // RB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LM', 'LCM', 'CDM', 'RCM', 'RM'],
          attackers: ['ST'],
          goalkeeper: 'GK'
        },
        advantages: [
          "중앙 수비형 미드필더가 수비 안정성을 높임.",
        ],
        disadvantages: [
          "공격 전환 시 공격력이 다소 약할 수 있음.",
        ]
      },
      '4-2-3-1': {
        attackers: [
          { x: '40%', y: '10%' }, // CF
        ],
        midfielders: [
          { x: '10%', y: '30%' }, // LM
          { x: '40%', y: '30%' }, // CM
          { x: '70%', y: '30%' }, // RM
          { x: '20%', y: '50%' }, // CDM
          { x: '60%', y: '50%' }, // CDM
        ],
        defenders: [
          { x: '-5%', y: '70%' }, // LB
          { x: '25%', y: '70%' }, // CB
          { x: '55%', y: '70%' }, // CB
          { x: '85%', y: '70%' }, // RB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LDM', 'RDM', 'CAM', 'LAM', 'RAM'],
          attackers: ['ST'],
          goalkeeper: 'GK'
        },
        advantages: [
          "중앙과 측면을 균형 있게 커버할 수 있음.",
        ],
        disadvantages: [
          "공격 선수가 고립될 수 있는 위험이 있음.",
        ]
      },
      '4-2-4': {
        attackers: [
            { x: '0%', y: '15%' }, // LW
            { x: '25%', y: '15%' }, // CF
            { x: '55%', y: '15%' }, // CF
            { x: '80%', y: '15%' }, // RW
          ],
        midfielders: [
            { x: '20%', y: '40%' }, // CM
            { x: '60%', y: '40%' }, // CM
          ],
        defenders: [
            { x: '0%', y: '65%' }, // CB
            { x: '25%', y: '65%' }, // CB
            { x: '55%', y: '65%' }, // LB
            { x: '80%', y: '65%' }, // RB
          ],
          goalkeeper: { x: '40%', y: '85%' }, // GK
          positionNames: {
            defenders: ['LB', 'LCB', 'RCB', 'RB'],
            midfielders: ['LCM', 'RCM'],
            attackers: ['LW', 'LS', 'RS', 'RW'],
            goalkeeper: 'GK'
          },
          advantages: [
            "강력한 공격력을 발휘할 수 있음.",
          ],
          disadvantages: [
            "수비진이 적어 역습에 취약함.",
          ]
    },
    '4-3-3': {
        attackers: [
            { x: '10%', y: '15%' }, // LW
            { x: '40%', y: '15%' }, // CF
            { x: '70%', y: '15%' }, // RW
          ],
        midfielders: [
            { x: '15%', y: '40%' }, // CM
            { x: '40%', y: '40%' }, // CM
            { x: '65%', y: '40%' }, // CM
          ],
        defenders: [
            { x: '0%', y: '65%' }, // LB
            { x: '27%', y: '65%' }, // CB
            { x: '53%', y: '65%' }, // CB
            { x: '80%', y: '65%' }, // RB
          ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LCM', 'CM', 'RCM'],
          attackers: ['LW', 'ST', 'RW'],
          goalkeeper: 'GK'
        },
        advantages: [
          "공격과 수비에서 균형을 맞출 수 있음.",
        ],
        disadvantages: [
          "측면 수비가 약해질 수 있음.",
        ]
    },
    '4-4-1-1': {
        attackers: [
          { x: '40%', y: '25%' }, // Second Striker
          { x: '40%', y: '5%' }, // CF
        ],
        midfielders: [
        { x: '0%', y: '45%' }, // LM
        { x: '27%', y: '45%' }, // CM
        { x: '53%', y: '45%' }, // CM
        { x: '80%', y: '45%' }, // RM
        ],
        defenders: [
        { x: '0%', y: '65%' }, // LB
        { x: '25%', y: '65%' }, // CB
        { x: '55%', y: '65%' }, // CB
        { x: '80%', y: '65%' }, // RB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LM', 'LCM', 'RCM', 'RM'],
          attackers: ['CAM','ST'],
          goalkeeper: 'GK'
        },
        advantages: [
          "중앙을 탄탄하게 지킬 수 있음.",
        ],
        disadvantages: [
          "측면 공격이 약해질 수 있음.",
        ]
        
      },
      '4-4-2': {
        attackers: [
          { x: '20%', y: '10%' }, // CF
          { x: '60%', y: '10%' }, // CF
        ],
        midfielders: [
          { x: '0%', y: '35%' }, // LM
          { x: '25%', y: '35%' }, // CM
          { x: '55%', y: '35%' }, // CM
          { x: '80%', y: '35%' }, // RM
        ],
        defenders: [
          { x: '0%', y: '60%' }, // LB
          { x: '25%', y: '60%' }, // CB
          { x: '55%', y: '60%' }, // CB
          { x: '80%', y: '60%' }, // RB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LM', 'LCM', 'RCM', 'RM'],
          attackers: ['ST', 'CF'],
          goalkeeper: 'GK'
        },
        advantages: [
          "전통적인 구조로 안정성이 높음.",
        ],
        disadvantages: [
          "창의적인 공격 전술이 부족할 수 있음.",
        ]
        
      },
    '4-5-1': {
        attackers: [
        { x: '40%', y: '10%' }, // CF
        ],
        midfielders: [
        { x: '-5%', y: '35%' }, // LM
        { x: '15%', y: '40%' }, // CM
        { x: '40%', y: '38%' }, // CM
        { x: '65%', y: '40%' }, // CM
        { x: '85%', y: '35%' }, // RM
        ],
        defenders: [

        { x: '0%', y: '65%' }, // LB
        { x: '25%', y: '65%' }, // CB
        { x: '55%', y: '65%' }, // CB
        { x: '80%', y: '65%' }, // RB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LB', 'LCB', 'RCB', 'RB'],
          midfielders: ['LM', 'LCM', 'CM', 'RCM', 'RM'],
          attackers: ['ST'],
          goalkeeper: 'GK',
        },
        advantages: [
          "중앙 미드필드에서 우세를 점할 수 있음.",
        ],
        disadvantages: [
          "단일 공격수로 인해 공격 옵션이 제한될 수 있음.",
        ]
    },
    '5-3-2': {
        attackers: [
        { x: '20%', y: '15%' }, // CF
        { x: '60%', y: '15%' }, // CF
        ],
        midfielders: [
            { x: '10%', y: '35%' }, // CM
            { x: '40%', y: '35%' }, // CM
            { x: '70%', y: '35%' }, // CM
        ],
        defenders: [
        { x: '-5%', y: '57%' },  // LWB
        { x: '15%', y: '65%' }, // CB
        { x: '40%', y: '63%' }, // CB
        { x: '65%', y: '65%' }, // CB
        { x: '85%', y: '57%' }, // RWB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LWB', 'LCB', 'CB', 'RCB', 'RWB'],
          midfielders: ['LCM', 'CM', 'RCM'],
          attackers: ['LS', 'RS'],
          goalkeeper: 'GK',
        },
        advantages: [
          "강력한 수비 라인을 구축할 수 있음.",
        ],
        disadvantages: [
          "공격 전환 시 공격 옵션이 제한적임.",
        ]
        
    },
    '5-4-1': {
        attackers: [
        { x: '40%', y: '10%' }, // CF
        ],
        midfielders: [
        { x: '0%', y: '35%' }, // LM
        { x: '27%', y: '35%' }, // CM
        { x: '53%', y: '35%' }, // CM
        { x: '80%', y: '35%' }, // RM
        ],
        defenders: [
            { x: '-5%', y: '57%' },  // LWB
            { x: '15%', y: '65%' }, // CB
            { x: '40%', y: '63%' }, // CB
            { x: '65%', y: '65%' }, // CB
            { x: '85%', y: '57%' }, // RWB
        ],
        goalkeeper: { x: '40%', y: '85%' }, // GK
        positionNames: {
          defenders: ['LWB', 'LCB', 'CB', 'RCB', 'RWB'],
          midfielders: ['LM', 'LCM', 'RCM', 'RM'],
          attackers: ['ST'],
          goalkeeper: 'GK',
        },
        advantages: [
          "수비에 집중할 수 있어 상대의 강력한 공격을 막을 수 있음.",
        ],
        disadvantages: [
          "공격 전환 시 공격수가 고립될 수 있음.",
        ]
        
    },
  };
  
  export default formations;
  