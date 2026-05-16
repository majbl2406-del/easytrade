import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Dimensions } from 'react-native';
import { useTheme } from '../../ThemeContext';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function FormationsScreen() {
  const { t, isRTL } = useLanguage();
  const { THEME, isDark } = useTheme();

  const [videos,     setVideos]     = useState([]);
  const [progress,   setProgress]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [completing, setCompleting] = useState(null);

  useEffect(() => { loadFormations(); loadProgress(); }, []);

  const loadFormations = async () => {
    try {
      const response = await api.get('/formations');
      if (response.data.success) {
        const allVideos = [];
        response.data.formations.forEach((formation) => {
          const vids = Array.isArray(formation.videos) ? formation.videos : [];
          vids.sort((a, b) => a.ordre - b.ordre).forEach((video) => {
            allVideos.push({
              uid:         `${formation.id}_${video.videoId}`,
              formationId: formation.id,
              videoId:     video.videoId,
              ordre:       video.ordre,
              titre:       video.titre,
              duree:       formation.duree,
              categorie:   formation.categorie,
              niveau:      formation.niveau,
            });
          });
        });
        setVideos(allVideos);
      }
    } catch (error) { console.error('Error loading formations:', error); }
    finally { setLoading(false); }
  };

  const loadProgress = async () => {
    try {
      const response = await api.get('/formations/progress');
      if (response.data.success) setProgress(response.data.progress);
    } catch (error) { console.error('Error loading progress:', error); }
  };

  const handleVideoEnd = async (formationId) => {
    if (progress[formationId]?.completed || completing === formationId) return;
    try {
      setCompleting(formationId);
      const response = await api.post('/formations/complete', { formationId });
      if (response.data.success) {
        Alert.alert('🎉 Bravo !', `Tu as gagné ${response.data.pointsGagnes} points !`);
        setProgress((prev) => ({ ...prev, [formationId]: { completed: true } }));
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setProgress((prev) => ({ ...prev, [formationId]: { completed: true } }));
      } else { console.error('Error completing formation:', error); }
    } finally { setCompleting(null); }
  };

  const styles = makeStyles(THEME, isDark);

  const renderVideo = ({ item }) => {
    const isCompleted = progress[item.formationId]?.completed;
    return (
      <View style={styles.card}>
        {item.categorie ? (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.categorie}</Text>
          </View>
        ) : null}

        <Text style={[styles.titre, isRTL && { textAlign: 'right' }]}>{item.titre}</Text>

        <View style={[styles.metaRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {item.duree ? (
            <View style={styles.metaItem}>
              <Icon name="access-time" size={15} color={THEME.gray} />
              <Text style={styles.metaText}>{item.duree}</Text>
            </View>
          ) : null}
          {item.niveau ? (
            <View style={styles.metaItem}>
              <Icon name="signal-cellular-alt" size={15} color={THEME.gray} />
              <Text style={styles.metaText}>{item.niveau}</Text>
            </View>
          ) : null}
          {isCompleted && (
            <View style={styles.metaItem}>
              <Icon name="check-circle" size={15} color="#4CAF50" />
              <Text style={[styles.metaText, { color: '#4CAF50' }]}>Terminée</Text>
            </View>
          )}
        </View>

        <View style={styles.playerWrapper}>
          <YoutubePlayer
            height={210}
            width={width - 48}
            play={false}
            videoId={item.videoId}
            onChangeState={(state) => { if (state === 'ended') handleVideoEnd(item.formationId); }}
          />
        </View>

        {completing === item.formationId && (
          <Text style={styles.validating}>Validation en cours...</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: THEME.background }]}>
        <Text style={{ color: THEME.gray }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>
          {t('my formations')}
        </Text>
      </View>

      {videos.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="school" size={48} color={THEME.gray} />
          <Text style={{ color: THEME.gray, marginTop: 10 }}>Aucune formation disponible</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const makeStyles = (THEME, isDark) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: THEME.background },
  header:         { backgroundColor: THEME.primary, padding: 20 },
  headerTitle:    { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  list:           { padding: 16, paddingBottom: 100 },
  card:           {
    backgroundColor: THEME.card,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 6,
    padding: 15,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryTag:    { backgroundColor: '#F5C518', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  categoryText:   { fontSize: 12, color: isDark ? '#1A1A1A' : '#FFFFFF', fontWeight: 'bold' },
  titre:          { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 10, lineHeight: 26 },
  metaRow:        { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:       { fontSize: 13, color: THEME.textSecondary },
  playerWrapper:  { borderRadius: 10, overflow: 'hidden' },
  validating:     { marginTop: 8, fontSize: 12, color: THEME.gray, textAlign: 'center', fontStyle: 'italic' },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
});