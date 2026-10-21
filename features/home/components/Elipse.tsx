import { View } from 'react-native';
import Svg, { Ellipse } from 'react-native-svg';
import { color } from '@/constants/Colors';

interface ElipseProps {
  largura: number;
  altura: number;
  centroX: number;
  centroY: number;
}

export default function Elipse({ largura, altura, centroX, centroY }: ElipseProps) {
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className="absolute"
      style={{ left: centroX - largura / 2, top: centroY - altura / 2, width: largura, height: altura }}
    >
      <Svg width={largura} height={altura}>
        <Ellipse
          cx={largura / 2}
          cy={altura / 2}
          rx={largura / 2}
          ry={altura / 2}
          fill={color.lineStrong}
          fillOpacity={0.2}
        />
      </Svg>
    </View>
  );
}
