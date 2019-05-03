const state = {
  main: 0,
  tabmesArr: [],
  tabKey: 0
}

const mutations = {
  DECREMENT_MAIN_COUNTER (state) {
    state.main--
  },
  INCREMENT_MAIN_COUNTER (state) {
    state.main++
  },
  initEnd (state, id) {
    let res = state.tabmesArr.findIndex((val, index) => {
      return val.allname === id
    })
    state.tabmesArr[res].init = false
  },
  changeKey (state, key) {
    state.tabKey = key
  },
  addTab (state, tab) {
    state.tabmesArr.push(tab)
    state.tabKey = state.tabmesArr.length - 1
  },
  changemesname (state, data) {
    state.tabmesArr[data.key].name = data.name
    state.tabmesArr[data.key].allname = data.allname
  },
  delTab (state, key) {
    if (key <= state.tabKey) {
      state.tabKey = state.tabKey - 1
    }
    state.tabmesArr.splice(key, 1)
  },
  changeTabstate (state, data) {
    let res = state.tabmesArr.findIndex((val, index) => {
      return val.allname === data.key
    })
    state.tabmesArr[res].editing = data.state
  }
}

const actions = {
  someAsyncTask ({ commit }) {
    // do something async
    commit('INCREMENT_MAIN_COUNTER')
  }
}

export default {
  state,
  mutations,
  actions
}
