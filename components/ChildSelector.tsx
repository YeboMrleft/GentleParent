import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { handleChildPhotoTap, loadChildPhotos } from '../utils/childPhotos';
import { playClickSound } from '../utils/sounds';

interface Props {
  childNames: string[];
  selected: string;
  onSelect: (name: string) => void;
  accentColor: string;
  isDarkMode: boolean;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ChildSelector({ childNames, selected, onSelect, accentColor, isDarkMode }: Props) {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    loadChildPhotos().then(setPhotos);
  }, []);

  if (childNames.length <= 1) {
    // Single child — still show avatar for photo management, but no selector tabs
    const name = childNames[0];
    if (!name) return null;
    const uri = photos[name];
    return (
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity
          onPress={() => handleChildPhotoTap(name, uri, setPhotos)}
          activeOpacity={0.85}
        >
          <Avatar name={name} uri={uri} size={64} accentColor={accentColor} isDarkMode={isDarkMode} />
          <View style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 20, height: 20, borderRadius: 10,
            backgroundColor: accentColor,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 11, color: 'white' }}>✏️</Text>
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: isDarkMode ? '#888' : '#999', marginTop: 6 }}>
          Tap to {uri ? 'change' : 'add'} photo
        </Text>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{
        fontSize: 11, fontWeight: '800', letterSpacing: 0.8,
        color: isDarkMode ? '#888' : '#999',
        marginBottom: 8,
      }}>
        CHILD
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {childNames.map((name) => {
          const active = selected === name;
          const uri = photos[name];
          return (
            <View key={name} style={{ alignItems: 'center', gap: 4 }}>
              {/* Long-press to manage photo, short press to select */}
              <TouchableOpacity
                onPress={() => { playClickSound(); onSelect(name); }}
                onLongPress={() => handleChildPhotoTap(name, uri, setPhotos)}
                activeOpacity={0.85}
              >
                <Avatar
                  name={name} uri={uri} size={48}
                  accentColor={accentColor} isDarkMode={isDarkMode}
                  active={active}
                />
                {!uri && (
                  <View style={{
                    position: 'absolute', bottom: -1, right: -1,
                    width: 16, height: 16, borderRadius: 8,
                    backgroundColor: accentColor + 'CC',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 9, color: 'white' }}>+</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={{
                fontSize: 11, fontWeight: active ? '700' : '500',
                color: active ? accentColor : (isDarkMode ? '#CCC' : '#666'),
              }}>
                {name}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <Text style={{ fontSize: 10, color: isDarkMode ? '#555' : '#BBB', marginTop: 6 }}>
        Long-press a child to add / change their photo
      </Text>
    </View>
  );
}

interface AvatarProps {
  name: string;
  uri?: string;
  size: number;
  accentColor: string;
  isDarkMode: boolean;
  active?: boolean;
}

function Avatar({ name, uri, size, accentColor, isDarkMode, active }: AvatarProps) {
  const borderColor = active ? accentColor : (isDarkMode ? '#444' : '#DDD');
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: active ? 2.5 : 1.5,
      borderColor,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#2A2A2A' : '#EEE',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{
          fontSize: size * 0.36,
          fontWeight: '700',
          color: active ? accentColor : (isDarkMode ? '#888' : '#AAA'),
        }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
