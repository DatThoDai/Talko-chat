import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Text, View} from 'react-native';

const AnimatedEllipsis = ({style, animationDelay = 300, numberOfDots = 3}) => {
  // Create animated values for each dot
  const opacityValues = useRef(
    Array(numberOfDots)
      .fill(0)
      .map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    // Create animations
    const animations = opacityValues.map((opacity, index) => {
      return Animated.sequence([
        // Wait based on dot index
        Animated.delay(index * animationDelay),
        // Fade in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        // Hold a bit
        Animated.delay(300),
        // Fade out
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]);
    });

    // Run loop
    const loopAnimation = () => {
      Animated.stagger(
        animationDelay,
        opacityValues.map(opacity => Animated.timing(opacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })),
      ).start(() => {
        Animated.parallel(animations).start(loopAnimation);
      });
    };

    loopAnimation();

    return () => {
      opacityValues.forEach(opacity => opacity.stopAnimation());
    };
  }, [opacityValues, animationDelay]);

  return (
    <View style={{flexDirection: 'row'}}>
      {opacityValues.map((opacity, index) => (
        <Animated.Text
          key={`dot-${index}`}
          style={[
            style,
            {
              opacity,
            },
          ]}>
          .
        </Animated.Text>
      ))}
    </View>
  );
};

export default AnimatedEllipsis;
