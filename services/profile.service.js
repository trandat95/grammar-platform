import { UserRepository } from "../repositories/user.repository";

export const ProfileService = {
  async getProfile(userId) {
    return await UserRepository.getProfile(userId);
  },

  async getAllProfiles() {
    return await UserRepository.getAllProfiles();
  },

  async updateRoleOrStatus(userId, { role, status }) {
    const updates = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    return await UserRepository.updateProfile(userId, updates);
  },
};
