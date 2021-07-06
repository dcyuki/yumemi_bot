const { checkCommand } = require('../../dist/util');
// 房间面积（群内最大人数/平方米）
// const m2: number = 300;
// 室外温度
// const outdoor: number = 30;
// 室内温度
// const indoor: number = 30;
// 湿度
// const humidity: number = 80;

// 环境温度的动态变化比我想象中要复杂的多...鸽了
class Aircon {
  constructor(m2, member) {
    this._enable = false;
    this._temperature = 20;
    this._m2 = m2;
    this._member = member;
  }

  get enable() {
    return this._enable;
  }

  set enable(val) {
    this._enable = val;
  }

  get temperature() {
    return this._temperature;
  }

  set temperature(val) {
    this._temperature = val;
  }

  get m2() {
    return this._m2;
  }

  set m2(val) {
    this._m2 = val;
  }

  get member() {
    return this._member;
  }

  set member(val) {
    this._member = val;
  }
}

const all_aircon = new Map();

function checkAircon(bot, group_id) {
  return new Promise((resolve, reject) => {
    bot.getGroupInfo(group_id)
      .then(data => {
        const group_info = data.data;
        const { max_member_count, member_count } = group_info;

        // 空调是否安装
        !all_aircon.has(group_id) && all_aircon.set(group_id, new Aircon(max_member_count, member_count))

        const aricon = all_aircon.get(group_id);

        // 更新空调信息
        aricon.m2 !== max_member_count ? aricon.m2 = max_member_count : void (0);
        aricon.member !== member_count ? aricon.member = member_count : void (0);
        resolve(aricon);
      })
      .catch((err) => {
        reject(err);
      })
  })
}

async function open(data, bot) {
  const { group_id, reply } = data;
  const aricon = await checkAircon(bot, group_id)
  const { enable, temperature } = aricon;

  // 空调是否开启
  if (!enable) {
    aricon.enable = true;
    // reply(`[CQ:record,file=./data/records/di.amr]`);
    reply(`哔~\n${temperature < 26 ? '❄️' : '☀️'} 当前温度 ${temperature} ℃`);
  } else {
    reply(`空调开着呢！`);
  }
}

async function close(data, bot) {
  const { group_id, reply } = data;
  const aricon = await checkAircon(bot, group_id)
  const { enable, temperature } = aricon;

  // 空调是否开启
  if (enable) {
    aricon.enable = false;
    // reply(`[CQ:record,file=./data/records/di.amr]`);
    reply(`哔~\n💤 当前温度 ${temperature}℃`);
  } else {
    reply(`空调关着呢！`);
  }
}

async function adjust(data, bot) {
  const { group_id, raw_message, reply } = data;
  const aricon = await checkAircon(bot, group_id)

  if (!aricon.enable) {
    reply(`你空调没开！`);
    return;
  }
  const temperature = Number(raw_message.match(/(?<=设置温度).*/g));

  switch (true) {
    case temperature === 114514:
      reply(`这空调怎么这么臭（恼）`);
      break;

    case temperature > 6000:
      reply(`温度最高不能超过 6000℃ 哦`);
      break;

    case temperature < -273:
      reply(`温度最少不能低于 -273℃ 哦`);
      break;

    default:
      aricon.temperature = temperature;

      let emoji = null;
      switch (true) {
        case temperature < 1:
          emoji = '🥶';
          break;
        case temperature < 26:
          emoji = '❄️';
          break;
        case temperature < 40:
          emoji = '☀️';
          break;
        case temperature <= 100:
          emoji = '🥵';
          break;
        case temperature <= 6000:
          emoji = '💀';
          break;
      }

      // reply(`[CQ:record,file=./data/records/di.amr]`);
      reply(`哔~\n${emoji} 当前温度 ${temperature}℃`);
      break;
  }
}

async function show(data, bot) {
  const { group_id, reply } = data;
  const aricon = await checkAircon(bot, group_id);

  if (!aricon.enable) return reply(`你空调没开！`);

  const { temperature } = aricon;
  let emoji = null;

  switch (true) {
    case temperature < 1:
      emoji = '🥶';
      break;
    case temperature < 26:
      emoji = '❄️';
      break;
    case temperature < 40:
      emoji = '☀️';
      break;
    case temperature <= 100:
      emoji = '🥵';
      break;
    case temperature <= 6000:
      emoji = '💀';
      break;
  }

  reply(`${emoji} 当前温度 ${temperature}℃`);
}

function listener(data) {
  const action = checkCommand('aircon', data, this);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate
}