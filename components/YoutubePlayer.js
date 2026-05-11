import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width } = Dimensions.get('window');

export default function VideoPlayer({ videoId, titre }) {
  const [playing, setPlaying] = useState(false);

  return (
    <View style={styles.container}>
      {titre && <Text style={styles.titre}>{titre}</Text>}
      <YoutubePlayer
        height={220}
        width={width - 32}
        play={playing}
        videoId={videoId}
        onChangeState={(state) => {
          if (state === 'ended') setPlaying(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  titre: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
});