import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const MOODS = [
  { emoji: '😩', label: 'Exhausted' },
  { emoji: '😔', label: 'Down' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];

const todayKey = () => `mood_${new Date().toISOString().split('T')[0]}`;

interface Props {
  userName: string;
  theme: any;
  isDarkMode: boolean;
}

export default function MoodCheckIn({ userName, theme, isDarkMode }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(todayKey()).then((val) => {
      if (val !== null) {
        setSelected(parseInt(val, 10));
        setSaved(true);
      }
    });
  }, []);

  const handleSelect = async (index: number) => {
    setSelected(index);
    setSaved(true);
    await AsyncStorage.setItem(todayKey(), String(index));
  };

  const handleReset = async () => {
    setSelected(null);
    setSaved(false);
    await AsyncStorage.removeItem(todayKey());
  };

  const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol = isDarkMode ? '#AAAAAA' : theme.cardSubText;

  return (
    <View style={{
      backgroundColor: cardBg, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: borderCol, marginBottom: 12,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: textCol, marginBottom: 10 }}>
        {saved && selected !== null
          ? `You're feeling ${MOODS[selected].emoji} today`
          : `How are you feeling${userName ? `, ${userName}` : ''}?`}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {MOODS.map((mood, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleSelect(i)}
            activeOpacity={0.75}
            style={{ alignItems: 'center', flex: 1, opacity: selected !== null && selected !== i ? 0.3 : 1 }}
          >
            <Text style={{ fontSize: selected === i ? 30 : 22 }}>{mood.emoji}</Text>
            {selected === i && (
              <Text style={{ fontSize: 9, color: theme.header, fontWeight: '700', marginTop: 3 }}>
                {mood.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {saved && (
        <TouchableOpacity onPress={handleReset} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: subCol }}>Change</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
