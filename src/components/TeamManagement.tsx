import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface TeamMember {
    id: string;
    company_id: string;
    user_id: string;
    email: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'pending' | 'active' | 'inactive';
    invited_at: string;
    accepted_at?: string;
    invited_by?: string;
}

export interface TeamInvitation {
    id: string;
    company_id: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    invited_by: string;
    invitation_token: string;
    expires_at: string;
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    created_at: string;
}

export interface ActivityLogEntry {
    id: string;
    company_id: string;
    user_id?: string;
    action_type: string;
    entity_type?: string;
    entity_id?: string;
    description: string;
    metadata: Record<string, any>;
    created_at: string;
}

interface TeamManagementProps {
    companyId: string;
    companyName: string;
    currentUserRole: 'owner' | 'admin' | 'member' | 'viewer';
}

export function TeamManagement({ companyId, companyName, currentUserRole }: TeamManagementProps) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'activity'>('members');

    const canManageTeam = ['owner', 'admin'].includes(currentUserRole);

    useEffect(() => {
        loadTeamData();
    }, [companyId]);

    const loadTeamData = async () => {
        setLoading(true);
        try {
            // Load team members
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false });

            if (membersError) throw membersError;
            setMembers(membersData || []);

            // Load invitations (if admin/owner)
            if (canManageTeam) {
                const { data: invitationsData, error: invitationsError } = await supabase
                    .from('team_invitations')
                    .select('*')
                    .eq('company_id', companyId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (!invitationsError) {
                    setInvitations(invitationsData || []);
                }

                // Load activity log
                const { data: activityData, error: activityError } = await supabase
                    .from('activity_log')
                    .select('*')
                    .eq('company_id', companyId)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (!activityError) {
                    setActivityLog(activityData || []);
                }
            }
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string, email: string) => {
        if (!confirm(`Remove ${email} from the team?`)) return;

        try {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            await loadTeamData();
            alert('Team member removed successfully');
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove team member');
        }
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;

            await loadTeamData();
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('team_invitations')
                .update({ status: 'revoked' })
                .eq('id', invitationId);

            if (error) throw error;

            await loadTeamData();
        } catch (error) {
            console.error('Error revoking invitation:', error);
            alert('Failed to revoke invitation');
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading team data...</div>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                        Team Management
                    </h1>
                    <p style={{ color: '#64748b' }}>{companyName}</p>
                </div>
                {canManageTeam && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>➕</span> Invite Team Member
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '2px solid #e2e8f0', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <TabButton
                        label="Team Members"
                        count={members.length}
                        active={activeTab === 'members'}
                        onClick={() => setActiveTab('members')}
                    />
                    {canManageTeam && (
                        <>
                            <TabButton
                                label="Pending Invitations"
                                count={invitations.length}
                                active={activeTab === 'invitations'}
                                onClick={() => setActiveTab('invitations')}
                            />
                            <TabButton
                                label="Activity Log"
                                count={activityLog.length}
                                active={activeTab === 'activity'}
                                onClick={() => setActiveTab('activity')}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            {activeTab === 'members' && (
                <MembersList
                    members={members}
                    canManage={canManageTeam}
                    currentUserRole={currentUserRole}
                    onRemove={handleRemoveMember}
                    onUpdateRole={handleUpdateRole}
                />
            )}

            {activeTab === 'invitations' && canManageTeam && (
                <InvitationsList
                    invitations={invitations}
                    onRevoke={handleRevokeInvitation}
                />
            )}

            {activeTab === 'activity' && canManageTeam && (
                <ActivityLogList activities={activityLog} />
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteMemberModal
                    companyId={companyId}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        setShowInviteModal(false);
                        loadTeamData();
                    }}
                />
            )}
        </div>
    );
}

function TabButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '1rem 0',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: active ? 'var(--color-primary)' : '#64748b',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}
        >
            {label}
            <span style={{
                background: active ? 'var(--color-primary)' : '#e2e8f0',
                color: active ? 'white' : '#64748b',
                padding: '0.125rem 0.5rem',
                borderRadius: '99px',
                fontSize: '0.85rem'
            }}>
                {count}
            </span>
        </button>
    );
}

function MembersList({
    members,
    canManage,
    currentUserRole,
    onRemove,
    onUpdateRole
}: {
    members: TeamMember[];
    canManage: boolean;
    currentUserRole: string;
    onRemove: (id: string, email: string) => void;
    onUpdateRole: (id: string, role: string) => void;
}) {
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return { bg: '#dcfce7', text: '#166534' };
            case 'admin': return { bg: '#dbeafe', text: '#1e40af' };
            case 'member': return { bg: '#e0e7ff', text: '#4338ca' };
            case 'viewer': return { bg: '#f3f4f6', text: '#374151' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {members.map((member, idx) => {
                const colors = getRoleBadgeColor(member.role);
                const canModify = canManage && member.role !== 'owner' && currentUserRole === 'owner';

                return (
                    <div
                        key={member.id}
                        style={{
                            padding: '1.5rem',
                            borderBottom: idx < members.length - 1 ? '1px solid #f1f5f9' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: colors.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.text,
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem'
                                }}>
                                    {member.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{member.email}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        {member.status === 'active' ? 'Active' : 'Pending'}
                                        {member.accepted_at && ` • Joined ${new Date(member.accepted_at).toLocaleDateString()}`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {canModify ? (
                                <select
                                    value={member.role}
                                    onChange={(e) => onUpdateRole(member.id, e.target.value)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        background: 'white',
                                        color: colors.text,
                                        fontWeight: '600'
                                    }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="member">Member</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            ) : (
                                <span style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    background: colors.bg,
                                    color: colors.text,
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                </span>
                            )}

                            {canModify && (
                                <button
                                    onClick={() => onRemove(member.id, member.email)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {members.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No team members yet
                </div>
            )}
        </div>
    );
}

function InvitationsList({
    invitations,
    onRevoke
}: {
    invitations: TeamInvitation[];
    onRevoke: (id: string) => void;
}) {
    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {invitations.map((inv, idx) => (
                <div
                    key={inv.id}
                    style={{
                        padding: '1.5rem',
                        borderBottom: idx < invitations.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div>
                        <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {inv.email}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Invited {new Date(inv.created_at).toLocaleDateString()} • Expires {new Date(inv.expires_at).toLocaleDateString()}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                        </span>

                        <button
                            onClick={() => onRevoke(inv.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Revoke
                        </button>
                    </div>
                </div>
            ))}

            {invitations.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No pending invitations
                </div>
            )}
        </div>
    );
}

function ActivityLogList({ activities }: { activities: ActivityLogEntry[] }) {
    const getActivityIcon = (type: string) => {
        if (type.includes('added')) return '➕';
        if (type.includes('removed')) return '➖';
        if (type.includes('changed')) return '🔄';
        if (type.includes('invited')) return '📧';
        return '📝';
    };

    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {activities.map((activity, idx) => (
                <div
                    key={activity.id}
                    style={{
                        padding: '1rem 1.5rem',
                        borderBottom: idx < activities.length - 1 ? '1px solid #f1f5f9' : 'none',
                        display: 'flex',
                        gap: '1rem'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>{getActivityIcon(activity.action_type)}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ color: '#1e293b', marginBottom: '0.25rem' }}>{activity.description}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {new Date(activity.created_at).toLocaleString()}
                        </div>
                    </div>
                </div>
            ))}

            {activities.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No activity yet
                </div>
            )}
        </div>
    );
}

function InviteMemberModal({
    companyId,
    onClose,
    onSuccess
}: {
    companyId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
    const [loading, setLoading] = useState(false);

    const handleInvite = async () => {
        if (!email) {
            alert('Please enter an email address');
            return;
        }

        setLoading(true);
        try {
            // Generate invitation token
            const token = btoa(`${companyId}:${email}:${Date.now()}`);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    company_id: companyId,
                    email,
                    role,
                    invitation_token: token,
                    expires_at: expiresAt.toISOString()
                });

            if (error) throw error;

            alert(`Invitation sent to ${email}`);
            onSuccess();
        } catch (error: any) {
            console.error('Error sending invitation:', error);
            alert(error.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                    Invite Team Member
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@example.com"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                        Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontSize: '1rem'
                        }}
                    >
                        <option value="admin">Admin - Full access except team management</option>
                        <option value="member">Member - Can view and edit data</option>
                        <option value="viewer">Viewer - Read-only access</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInvite}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Invitation'}
                    </button>
                </div>
            </div>
        </div>
    );
}
