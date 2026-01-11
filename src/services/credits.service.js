const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * CreditsService - Handles credit operations for users
 */
class CreditsService {
  /**
   * Deduct credits from user account
   * @param {string} userId - User ID
   * @param {number} amount - Amount to deduct
   * @param {string} description - Transaction description
   * @param {string} relatedEntityId - Related entity ID (e.g., message_id, agent_id)
   * @returns {Promise<Object>} Transaction result
   */
  async deductCredits(userId, amount, description, relatedEntityId = null) {
    try {
      // Get current balance
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('credits_balance, credits_used')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        throw new Error('User profile not found');
      }

      const currentBalance = profile.credits_balance || 0;
      const newBalance = currentBalance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient credits');
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          credits_balance: newBalance,
          credits_used: (profile.credits_used || 0) + amount
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Failed to update credits: ' + updateError.message);
      }

      // Log transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'debit',
          amount: amount,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: description,
          related_entity_id: relatedEntityId
        });

      if (transactionError) {
        logger.error('Failed to log credit transaction:', transactionError);
        // Don't throw - credits were deducted, just logging failed
      }

      logger.info(`Deducted ${amount} credits from user ${userId}. New balance: ${newBalance}`);

      return {
        success: true,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        amountDeducted: amount
      };
    } catch (error) {
      logger.error('deductCredits error:', error);
      throw error;
    }
  }

  /**
   * Check if user has enough credits
   * @param {string} userId - User ID
   * @param {number} amount - Required amount
   * @returns {Promise<boolean>} True if user has enough credits
   */
  async hasEnoughCredits(userId, amount) {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      logger.error('hasEnoughCredits error:', error);
      return false;
    }
  }

  /**
   * Get user's credit balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} Credit balance
   */
  async getBalance(userId) {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        logger.error('Get balance error:', error);
        return 0;
      }

      return profile.credits_balance || 0;
    } catch (error) {
      logger.error('getBalance error:', error);
      return 0;
    }
  }
}

// Export singleton instance
module.exports = new CreditsService();
