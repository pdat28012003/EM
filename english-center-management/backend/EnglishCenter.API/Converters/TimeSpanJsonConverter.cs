using System.Text.Json;
using System.Text.Json.Serialization;

namespace EnglishCenter.API.Converters
{
    public class TimeSpanJsonConverter : JsonConverter<TimeSpan>
    {
        public override TimeSpan Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            
            if (string.IsNullOrEmpty(value))
                return TimeSpan.Zero;

            // Try to parse as TimeSpan formats
            if (TimeSpan.TryParse(value, out var result))
                return result;

            // If parsing fails, throw an exception
            throw new JsonException($"Unable to convert \"{value}\" to TimeSpan.");
        }

        public override void Write(Utf8JsonWriter writer, TimeSpan value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString(@"hh\:mm\:ss"));
        }
    }
}
