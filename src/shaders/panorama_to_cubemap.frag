#define MATH_PI 3.1415926535897932384626433832795
#define MATH_INV_PI (1.0 / MATH_PI)

precision highp float;


in vec2 texCoord;
out vec4 fragmentColor;


uniform int u_currentFace;

uniform sampler2D u_inputTexture;
uniform sampler2D u_panorama;

vec3 uvToXYZ(int face, vec2 uv)
{
	if(face == 0)
		return vec3(     1.f,   uv.y,    -uv.x);

	else if(face == 1)
		return vec3(    -1.f,   uv.y,     uv.x);

	else if(face == 2)
		return vec3(   +uv.x,   -1.f,    +uv.y);

	else if(face == 3)
		return vec3(   +uv.x,    1.f,    -uv.y);

	else if(face == 4)
		return vec3(   +uv.x,   uv.y,      1.f);

	else //if(face == 5)
	{	return vec3(    -uv.x,  +uv.y,     -1.f);}
}

vec2 dirToUV(vec3 dir)
{
	return vec2(
		0.5f + 0.5f * atan(dir.z, dir.x) / MATH_PI,
		1.f - acos(dir.y) / MATH_PI);
}

vec3 panoramaToCubeMap(int face, vec2 texCoord)
{
	vec2 texCoordNew = texCoord*2.0-1.0;
	vec3 scan = uvToXYZ(face, texCoordNew);
	vec3 direction = normalize(scan);
	vec2 src = dirToUV(direction);

	return  texture(u_panorama, src).rgb;
}



void main(void)
{
    fragmentColor = vec4(0.0, 0.0, 0.0, 1.0);

	fragmentColor.rgb = panoramaToCubeMap(u_currentFace, texCoord);
}
