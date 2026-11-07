import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, apiClient } from '@shared/services/api';
import { useTheme } from '@theme/index';
import { Button, Card, EmptyState, ErrorState, LoadingState } from '@components/ui';

type Group = { id: string; name: string; rules?: string | null; membership?: { role: 'ADMIN' | 'MEMBER' } };
type Message = { id: string; senderId: string; body: string; createdAt: string };
type Envelope<T> = { data: T };

export default function GroupsScreen() {
  const { colors, spacing, typography, radius } = useTheme();
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [draft, setDraft] = useState('');
  const [communityTermsChecked, setCommunityTermsChecked] = useState(false);
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => apiClient.get<Envelope<Group[]>>('/groups').then((res) => res.data ?? []) });
  const playpals = useQuery({ queryKey: ['friends'], queryFn: () => apiClient.get<Envelope<Array<{ id: string; firstName?: string; lastName?: string }>>>('/friends').then((res) => res.data ?? []) });
  const messages = useQuery({ queryKey: ['groups', activeGroup?.id, 'messages'], enabled: !!activeGroup, queryFn: () => apiClient.get<Envelope<Message[]>>(`/groups/${activeGroup!.id}/messages`).then((res) => res.data ?? []) });
  const consent = useQuery({ queryKey: ['community-consent'], queryFn: () => apiClient.get<Envelope<{ accepted: boolean }>>('/users/me/community-consent').then((res) => res.data) });
  useEffect(() => { if (consent.data?.accepted) setCommunityTermsChecked(true); }, [consent.data?.accepted]);
  const reload = () => { void groups.refetch(); void messages.refetch(); };
  const refreshGroups = () => { void client.invalidateQueries({ queryKey: ['groups'] }); };
  const ensureCommunityConsent = async () => {
    if (!communityTermsChecked) throw new Error('Please accept the community guidelines before creating a group or sending a message.');
    if (!consent.data?.accepted) await apiClient.post('/users/me/community-consent', { accepted: true });
  };
  const create = useMutation({ mutationFn: async () => { await ensureCommunityConsent(); return apiClient.post('/groups', { name: name.trim() }); }, onSuccess: () => { setName(''); refreshGroups(); }, onError: (error: any) => Alert.alert('Could not create group', error?.message ?? 'Please try again.') });
  const send = useMutation({ mutationFn: async () => { await ensureCommunityConsent(); return apiClient.post(`/groups/${activeGroup!.id}/messages`, { body: draft.trim() }); }, onSuccess: () => { setDraft(''); void messages.refetch(); }, onError: (error: any) => Alert.alert('Could not send message', error?.message ?? 'Please try again.') });
  const leave = useMutation({ mutationFn: (id: string) => apiClient.delete(`/groups/${id}/members/me`), onSuccess: () => { setActiveGroup(null); refreshGroups(); }, onError: (error: any) => Alert.alert('Could not leave group', error?.message ?? 'Please try again.') });
  const addMember = useMutation({ mutationFn: (userId: string) => apiClient.post(`/groups/${activeGroup!.id}/members`, { userId }), onSuccess: () => { refreshGroups(); Alert.alert('Playpal added', 'They can now read and send messages in this group.'); }, onError: (error: any) => Alert.alert('Could not add playpal', error?.message ?? 'Please try again.') });
  const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.background.screen }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }, title: { ...typography.h3, color: colors.text.primary }, body: { ...typography.body2, color: colors.text.secondary }, input: { minHeight: 48, borderWidth: 1, borderColor: colors.border.medium, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text.primary, backgroundColor: colors.background.primary, ...typography.body1 }, section: { ...typography.h5, color: colors.text.primary, marginTop: spacing.md }, row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, groupName: { ...typography.subtitle2, color: colors.text.primary, flex: 1 }, message: { ...typography.body2, color: colors.text.primary }, muted: { ...typography.caption, color: colors.text.tertiary } });
  const consentControl = <View style={{ gap: spacing.xs }}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: communityTermsChecked }} onPress={() => setCommunityTermsChecked((current) => !current)} style={styles.row}><Text style={{ color: colors.primary[700], fontSize: 22 }}>{communityTermsChecked ? '☑' : '□'}</Text><Text style={[styles.body, { flex: 1 }]}>I agree to follow Playmate’s community guidelines and keep group content respectful and lawful.</Text></Pressable><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(`${API_BASE_URL.replace(/\/$/, '')}/legal/community-guidelines`); }}><Text style={[styles.body, { color: colors.primary[700], textDecorationLine: 'underline' }]}>Read the full community guidelines</Text></Pressable></View>;
  if (groups.isLoading) return <LoadingState label="Loading your groups…" />;
  if (groups.isError) return <ErrorState title="Could not load groups" description="Check your connection and try again." action={<Button title="Retry" variant="outline" onPress={reload} />} />;
  if (activeGroup) return (
    <View style={styles.page}>
      <FlatList data={[...(messages.data ?? [])].reverse()} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={messages.isRefetching} onRefresh={() => void messages.refetch()} />} ListHeaderComponent={<View style={{ gap: spacing.md }}><Text style={styles.title}>{activeGroup.name}</Text>{activeGroup.rules ? <Text style={styles.body}>Group rules: {activeGroup.rules}</Text> : null}{consentControl}{activeGroup.membership?.role === 'ADMIN' ? <><Text style={styles.section}>Add a playpal</Text>{(playpals.data ?? []).map((player) => <View key={player.id} style={styles.row}><Text style={[styles.body, { flex: 1 }]}>{[player.firstName, player.lastName].filter(Boolean).join(' ') || 'Playpal'}</Text><Button title="Add" size="sm" variant="outline" loading={addMember.isPending} onPress={() => addMember.mutate(player.id)} /></View>)}</> : null}<Button title="Leave group" size="sm" variant="outline" onPress={() => Alert.alert('Leave group?', 'You can be invited again later.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: () => leave.mutate(activeGroup.id) }])} /><Text style={styles.section}>Group chat</Text></View>} renderItem={({ item }) => <Card padding="md"><Text style={styles.message}>{item.body}</Text><Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text></Card>} ListEmptyComponent={<EmptyState title="Start the conversation" description="Share plans and updates with your group." />} />
      <View style={[styles.row, { padding: spacing.md, backgroundColor: colors.background.primary }]}><TextInput style={[styles.input, { flex: 1 }]} value={draft} onChangeText={setDraft} placeholder="Write a message" placeholderTextColor={colors.text.tertiary} maxLength={2000} /><Button title="Send" size="sm" disabled={!draft.trim() || !communityTermsChecked} loading={send.isPending} onPress={() => send.mutate()} /></View>
    </View>
  );
  return <FlatList style={styles.page} contentContainerStyle={styles.content} data={groups.data ?? []} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={groups.isRefetching} onRefresh={() => void groups.refetch()} />} ListHeaderComponent={<View style={{ gap: spacing.sm }}><Text style={styles.title}>Your groups</Text><Text style={styles.body}>Create a crew for recurring games. Group admins can add accepted playpals.</Text>{consentControl}<View style={styles.row}><TextInput style={[styles.input, { flex: 1 }]} value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor={colors.text.tertiary} maxLength={80} /><Button title="Create" size="sm" disabled={name.trim().length < 3 || !communityTermsChecked} loading={create.isPending} onPress={() => create.mutate()} /></View></View>} renderItem={({ item }) => <Card padding="lg"><View style={styles.row}><Text style={styles.groupName}>{item.name}</Text><Text style={styles.muted}>{item.membership?.role}</Text></View>{item.rules ? <Text style={styles.body}>{item.rules}</Text> : null}<Button title="Open group chat" size="sm" variant="outline" onPress={() => setActiveGroup(item)} /></Card>} ListEmptyComponent={<EmptyState title="Create your first group" description="Gather your regular crew in one place." />} />;
}
