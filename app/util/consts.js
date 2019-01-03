module.exports = {
    code: {
        SUCCESS: 'success',
        FAIL: 'fail'
    },
    role: {
        HIDER: 'master',
        SEEKER: 'customer'
    },
    hideStatus: {
        FOUND: 'found',
        NOT_FOUND: 'not_found'
    },
    HAS_ACTION: {
        START_SEEK: 'startSeek',
        END_GAME: 'endGame',
        FIND_NEXT: 'findNext',
        UPDATE_SCOREBOARD: 'updateScoreBoard'
    },
    KillerRole: {
        KILLER: 'killer',
        COMMONER: 'commoner'
    },
    KillerPhase: {
        INIT: 'init',
        CONFIRM: 'confirm',
        OUT: 'out',
        WIN: 'win'
    },
    KillerAction: {
        START_HIDE: 'startHide',
        START_VOTE: 'startVote',
        VOTE_OUT: 'voteOut',
        START_SEEK: 'startSeek',
        GAME_OVER: 'endGame',
        STOP_FIND: 'stopFind',
        GET_KILLED: 'wasKilled',
        NEXT_CYCLE: 'nextCycle'
    },
    CrazyZooAction: {
        START_GAME: 'startGame',
        LOCK_MONSTER: 'lock',
        ATTACK_MONSTER : 'attack',
        END_GAME: 'endGame'
    },
    CrazyZooConsts: {
        DEFAULT_RADIUS: 30,
        DETECTIVE_DISTANCE: 10000,
        ESCAPE_DISTANCE: 10
    },
    GameRoute: {
        KILLER_GAME: 'onKiller',
        DEFAULT: 'onChat',
        PREPARED: 'onPrepared',
        ZOO_GAME: 'onZoo'
    },
    UserState:{
        NONE:0,
        IN_PRPAREDROOM:1,
        IN_GAME:2
    },
    UNLOCK_REFRESH_HOUR: 6,

    USER_OPERATION_TYPE: {
        REGISTER: 0,
        RESET_PASSWORD: 1
    },
    REGISTER_CHECK_CODE: {
        length: 6,
        pool: '0123456789'
    },
    ROOM_GENERATOR_CODE: {
        length: 6,
        pool: '0123456789'
    },

    ITEM_TYPE: {
        WOOL: 0,
        CUTTER: 1,
        TICKET: 2
    },

    CBS_COUNT_BY_PAGE: {
        1: 10,
        2: 30,
        3: 50,
        4: 100
    },
    DEATH_REASON: {
        ALIVE: 0,
        UPLOAD_MARK_TIMEOUT: 1,
        VOTED_OUT: 2,
        WAS_FOUND: 3,
        EXIT_ROOM: 4
    }
};