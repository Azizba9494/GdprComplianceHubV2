import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

// Profile update schema
const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
});

// Password update schema
const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

// Company creation schema
const createCompanySchema = z.object({
  name: z.string().min(1),
  rcsNumber: z.string().optional(),
  address: z.string().optional(),
  sector: z.string().optional(),
});

// Invitation schema
const inviteCollaboratorSchema = z.object({
  email: z.string().email(),
  companyId: z.number(),
  permissions: z.array(z.string()),
});

// GET /api/user/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Don't send password
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/user/profile - Update user profile
router.patch('/profile', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const updatedUser = await storage.updateUser(userId, validatedData);
    
    // Don't send password
    const { password, ...userProfile } = updatedUser;
    res.json(userProfile);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/user/password - Update user password
router.patch('/password', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Verify current password (simplified - in production use proper password hashing)
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    await storage.updateUser(userId, { password: newPassword });
    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error: any) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/subscription - Get user subscription
router.get('/subscription', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const subscription = await storage.getUserSubscription(userId);
    res.json(subscription);
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/company-access - Get user's company access
router.get('/company-access', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const access = await storage.getUserCompanyAccess(userId);
    res.json(access);
  } catch (error: any) {
    console.error('Error fetching company access:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user/companies - Create new company
router.post('/companies', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Check subscription limits
    const subscription = await storage.getUserSubscription(userId);
    if (!subscription) {
      return res.status(400).json({ error: "Aucun abonnement trouvé" });
    }

    const userAccess = await storage.getUserCompanyAccess(userId);
    const ownedCompanies = userAccess.filter(access => access.role === 'owner');
    
    if (ownedCompanies.length >= subscription.maxCompanies) {
      return res.status(400).json({ 
        error: `Limite de ${subscription.maxCompanies} sociétés atteinte pour votre abonnement` 
      });
    }

    const validatedData = createCompanySchema.parse(req.body);
    
    // Create company
    const company = await storage.createCompany({
      name: validatedData.name,
      sector: validatedData.sector || null,
      size: "small", // Default size
      rcsNumber: validatedData.rcsNumber || null,
      address: validatedData.address || null,
      userId: userId
    });

    // Create owner access
    await storage.createUserCompanyAccess({
      userId: userId,
      companyId: company.id,
      role: 'owner',
      permissions: ['all'],
      status: 'active'
    });

    res.json(company);
  } catch (error: any) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/user/invoices - Get user invoices
router.get('/invoices', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const invoices = await storage.getUserInvoices(userId);
    res.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/company/collaborators/:companyId - Get company collaborators
router.get('/collaborators/:companyId', async (req, res) => {
  try {
    const userId = req.session?.userId;
    const companyId = parseInt(req.params.companyId);
    
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Check if user has access to this company
    const userAccess = await storage.getUserCompanyAccess(userId);
    const hasAccess = userAccess.some(access => 
      access.companyId === companyId && ['owner', 'admin'].includes(access.role || '')
    );

    if (!hasAccess) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const collaborators = await storage.getCompanyCollaborators(companyId);
    res.json(collaborators);
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/company/invite - Invite collaborator
router.post('/invite', async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { email, companyId, permissions } = inviteCollaboratorSchema.parse(req.body);

    // Check if user can invite to this company
    const userAccess = await storage.getUserCompanyAccess(userId);
    const hasPermission = userAccess.some(access => 
      access.companyId === companyId && 
      ['owner', 'admin'].includes(access.role || '') &&
      (access.permissions?.includes('all') || access.permissions?.includes('invite'))
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Permission insuffisante pour inviter" });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await storage.createInvitation({
      email,
      companyId,
      invitedBy: userId,
      permissions,
      token,
      expiresAt,
      status: 'pending'
    });

    // TODO: Send email invitation here
    console.log(`Invitation sent to ${email} with token: ${token}`);

    res.json({ message: "Invitation envoyée avec succès", invitation });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/company/access/:accessId - Revoke access
router.delete('/access/:accessId', async (req, res) => {
  try {
    const userId = req.session?.userId;
    const accessId = parseInt(req.params.accessId);
    
    if (!userId) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // Check if user has permission to revoke this access
    const userAccess = await storage.getUserCompanyAccess(userId);
    const targetAccess = await storage.getUserCompanyAccess(accessId);
    
    if (!targetAccess.length) {
      return res.status(404).json({ error: "Accès non trouvé" });
    }

    const companyId = targetAccess[0].companyId;
    const hasPermission = userAccess.some(access => 
      access.companyId === companyId && 
      ['owner', 'admin'].includes(access.role || '')
    );

    if (!hasPermission) {
      return res.status(403).json({ error: "Permission insuffisante" });
    }

    await storage.deleteUserCompanyAccess(accessId);
    res.json({ message: "Accès révoqué avec succès" });
  } catch (error: any) {
    console.error('Error revoking access:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;