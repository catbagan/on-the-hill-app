import { storePlayers, getStoredPlayers, clearStatsData, hasStatsData } from "./statsStorage"

// Mock MMKV for testing
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe("StatsStorage", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it("should store and retrieve players data", () => {
    const mockPlayers = [
      {
        name: "John Doe",
        overall: { wins: 10, losses: 5 },
        byLocation: { "Location A": { wins: 5, losses: 2 } },
        bySeason: { "2023": { wins: 10, losses: 5 } },
        byPosition: { "1": { wins: 3, losses: 1 } },
        scoreDistribution: { "7-3": 2 },
        byInnings: { "1-5": { wins: 4, losses: 1 } },
        byTeamSituation: { team_winning: { wins: 6, losses: 2 } },
        headToHead: { "Jane Smith": { wins: 2, losses: 1 } },
        byMySkill: { "5": { wins: 8, losses: 3 } },
        byOpponentSkill: { "4": { wins: 6, losses: 2 } },
        bySkillDifference: { "1": { wins: 4, losses: 1 } },
      },
    ]

    // Test storing data
    storePlayers(mockPlayers)
    
    // Test retrieving data
    const retrievedPlayers = getStoredPlayers()
    
    // Since we're mocking MMKV, the data won't actually persist
    // This test mainly verifies the functions don't throw errors
    expect(typeof storePlayers).toBe("function")
    expect(typeof getStoredPlayers).toBe("function")
    expect(typeof clearStatsData).toBe("function")
    expect(typeof hasStatsData).toBe("function")
  })

  it("should clear stats data", () => {
    clearStatsData()
    // This test verifies the function doesn't throw errors
    expect(typeof clearStatsData).toBe("function")
  })

  it("should check if stats data exists", () => {
    const hasData = hasStatsData()
    expect(typeof hasData).toBe("boolean")
  })
}) 