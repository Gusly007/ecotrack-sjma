import consentRepository from '../repositories/consentRepository.js';

class CookieConsentController {
  /**
   * Enregistrer le consentement aux cookies
   */
  static async recordConsent(req, res) {
    try {
      const { session_id, consent_status, cookies_accepted } = req.body;

      if (!session_id || !consent_status || !cookies_accepted) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: session_id, consent_status, cookies_accepted'
        });
      }

      if (!['ACCEPTED', 'REJECTED', 'PENDING'].includes(consent_status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid consent_status'
        });
      }

      // Extract first IP from X-Forwarded-For (may contain multiple IPs separated by comma)
      let ip_address = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
      const user_agent = req.headers['user-agent'] || 'unknown';
      const action = consent_status === 'REJECTED' ? 'REJECTED' : 'ACCEPTED';

      const result = await consentRepository.logConsent({
        userId: req.user?.id || null,
        sessionId: session_id,
        type: 'cookies',
        action,
        version: '1.0',
        intitule: `Consentement cookies: ${action.toLowerCase()}`,
        ipAddress: ip_address,
        userAgent: user_agent
      });

      return res.status(200).json({
        success: true,
        message: 'Cookie consent recorded successfully',
        data: {
          id: result.id,
          session_id,
          consent_status: action,
          cookies_accepted
        }
      });
    } catch (error) {
      console.error('Error recording cookie consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record cookie consent'
      });
    }
  }

  /**
   * Récupérer le consentement existant
   */
  static async getConsent(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID required'
        });
      }

      const result = await consentRepository.getConsentBySession(sessionId, 'cookies');

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'No consent record found for this session'
        });
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching cookie consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cookie consent'
      });
    }
  }

  /**
   * Mettre à jour le consentement
   */
  static async updateConsent(req, res) {
    try {
      const { sessionId } = req.params;
      const { cookies_accepted } = req.body;

      if (!sessionId || !cookies_accepted) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: sessionId, cookies_accepted'
        });
      }

      await consentRepository.deleteConsentBySession(sessionId, 'cookies');
      const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const result = await consentRepository.logConsent({
        userId: req.user?.id || null,
        sessionId,
        type: 'cookies',
        action: 'ACCEPTED',
        version: '1.0',
        intitule: 'Consentement cookies mis à jour',
        ipAddress,
        userAgent
      });

      return res.status(200).json({
        success: true,
        message: 'Cookie consent updated successfully',
        data: {
          id: result.id,
          session_id: sessionId,
          cookies_accepted
        }
      });
    } catch (error) {
      console.error('Error updating cookie consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update cookie consent'
      });
    }
  }

  /**
   * Supprimer le consentement (droit à l'oubli - RGPD)
   */
  static async deleteConsent(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID required'
        });
      }

      await consentRepository.deleteConsentBySession(sessionId, 'cookies');

      return res.status(200).json({
        success: true,
        message: 'Cookie consent deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting cookie consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete cookie consent'
      });
    }
  }

  /**
   * Récupérer statistiques de consentement (admin)
   */
  static async getConsentStats(req, res) {
    try {
      const result = await consentRepository.getConsentStats('cookies');

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching consent stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch consent statistics'
      });
    }
  }
}

export default CookieConsentController;
