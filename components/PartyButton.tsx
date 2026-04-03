import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface PartyButtonProps {
  title: string;
  onPress: () => void;
  color?: 'primary' | 'secondary' | 'danger' | 'success';
}

export function PartyButton({ title, onPress, color = 'primary' }: PartyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const baseColors = {
    primary: 'bg-blue-500', secondary: 'bg-yellow-400', danger: 'bg-red-500', success: 'bg-green-500',
  };
  const borderColors = {
    primary: 'bg-blue-700', secondary: 'bg-yellow-600', danger: 'bg-red-700', success: 'bg-green-700',
  };

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={() => setIsPressed(true)} onPressOut={() => setIsPressed(false)} onPress={onPress}>
      <View className="mb-4 h-20">
        <View className={`absolute top-2 w-full h-[68px] rounded-3xl ${borderColors[color]}`} />
        <View className={`absolute w-full h-[68px] rounded-3xl items-center justify-center flex-row px-4 ${baseColors[color]} ${isPressed ? 'top-2' : 'top-0'}`}>
          <Text className="text-white text-3xl font-black tracking-widest uppercase text-center" style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 1 }}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
