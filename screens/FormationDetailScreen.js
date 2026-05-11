import React, { useState } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Dimensions, SafeAreaView,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

export default function FormationDetailScreen({ route }) {
  const { formation } = route.params ?? {};
  const [activeVideo, setActiveVideo] = useState(null);

  // Garde-fou : données manquantes
  if (!formation) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Formation introuvable.</Text>
      </SafeAreaView>
    );
  }

  const videos = Array.isArray(formation.videos)
    ? [...formation.videos].sort((a, b) => a.ordre - b.ordre)
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* En-tête */}
        <Text style={styles.titre}>{formation.titre}</Text>
        <Text style={styles.description}>{formation.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaTag}>{formation.niveau ?? 'Tous niveaux'}</Text>
          <Text style={styles.metaTag}>{formation.duree}</Text>
        </View>

        {/* Liste des vidéos */}
        {videos.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune vidéo disponible pour cette formation.</Text>
          </View>
        ) : (
          videos.map((video) => {
            const isActive = activeVideo === video.videoId;
            return (
              <View key={video.videoId} style={styles.videoCard}>
                <Text style={styles.videoTitre}>
                  {video.ordre}. {video.titre}
                </Text>

                {isActive ? (
                  <YoutubePlayer
                    height={210}
                    width={width - 32}
                    play={true}
                    videoId={video.videoId}
                    onChangeState={(state) => {
                      if (state === 'ended') setActiveVideo(null);
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => setActiveVideo(video.videoId)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.playIcon}>▶</Text>
                    <Text style={styles.playTxt}>Lancer la vidéo</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, padding: 16, backgroundColor: '#fff' },
  titre:       { fontSize: 22, fontWeight: 'bold', marginBottom: 6, color: '#222' },
  description: { fontSize: 14, color: '#666', marginBottom: 12 },

  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metaTag: {
    backgroundColor: '#EEE', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 8,
    fontSize: 12, color: '#555',
  },

  videoCard: {
    marginBottom: 20, borderRadius: 10,
    backgroundColor: '#f5f5f5', padding: 12,
  },
  videoTitre: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#333' },

  playBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E53935', borderRadius: 8,
    padding: 12, justifyContent: 'center',
  },
  playIcon: { color: '#fff', fontSize: 18, marginRight: 8 },
  playTxt:  { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  emptyBox: {
    marginTop: 40, alignItems: 'center', padding: 20,
    backgroundColor: '#fafafa', borderRadius: 10,
  },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  errorText: { margin: 30, fontSize: 16, color: 'red', textAlign: 'center' },
});